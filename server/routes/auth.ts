import KoaRouter from '@koa/router';
import { base64url, EncryptJWT } from 'jose';
import {
  generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse,
  type VerifiedRegistrationResponse, type VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import { createRes } from '../utils';
import { JWT_SECRET, TOKEN } from '../config';
import { prisma } from '../prisma';
import { checkLogin } from '../middlewares/auth';

const authRouter = new KoaRouter({ prefix: '/api/v1/auth' });

const createJWT = async () => {
  const secret = base64url.decode(JWT_SECRET);
  const jwt = await new EncryptJWT()
    .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
    .setIssuedAt()
    .setIssuer('server')
    .setAudience('client:web')
    .setExpirationTime('180days')
    .encrypt(secret);
  return jwt;
};

authRouter.get('/check', async (ctx) => {
  const isLogin = await checkLogin(ctx);
  ctx.body = createRes({ isLogin });
});

authRouter.post('/login', async (ctx) => {
  const { password } = ctx.request.body;
  if (!password) {
    ctx.body = createRes(null, 400, '未传入密码');
    return;
  }
  if (password !== TOKEN) {
    ctx.body = createRes(null, 400, '密码不正确');
    return;
  }
  const jwt = await createJWT();

  ctx.body = createRes({ token: jwt });
});

const rpName = 'writing webauthn';
const rpID = 'localhost';
const origin = `http://${rpID}`;

const userId = 'root';
const userName = 'root';

enum ConfigKey {
  WebAuthnChallenge = 'WebAuthnChallenge',
  WebauthnAuthenticators = 'WebAuthnAuthenticators',
}

authRouter.get('/webauthn/can-register', async (ctx) => {
  // 在未登录情况下，只有未设置密码，且没有注册过webAuthn时才可以注册
  if (await checkLogin(ctx)) {
    ctx.body = createRes({ canRegister: true });
    return;
  }
  if (TOKEN) {
    ctx.body = createRes({ canRegister: false });
    return;
  }
  const authenticators = await prisma.config.findFirst({ where: { key: ConfigKey.WebauthnAuthenticators } })
    .then((record) => {
      if (!record) return [];
      return JSON.parse(record.value);
    });
  if (authenticators.length) {
    ctx.body = createRes({ canRegister: false });
    return;
  }
  ctx.body = createRes({ canRegister: true });
});

authRouter.post('/webauthn/register-options', async (ctx) => {
  const authenticators = await prisma.config.findFirst({ where: { key: ConfigKey.WebauthnAuthenticators } })
    .then((record) => {
      if (!record) return [];
      return JSON.parse(record.value);
    });
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: userId,
    userName,
    // Don't prompt users for additional information about the authenticator
    // (Recommended for smoother UX)
    attestationType: 'none',
    // Prevent users from re-registering existing authenticators
    excludeCredentials: authenticators.map((authenticator) => ({
      id: base64url.decode(authenticator.credentialID),
      type: 'public-key',
      // Optional
      transports: authenticator.transports,
    })),
    // See "Guiding use of authenticators via authenticatorSelection" below
    authenticatorSelection: {
      // Defaults
      residentKey: 'preferred',
      userVerification: 'preferred',
      // Optional
      authenticatorAttachment: 'cross-platform',
    },
  });
  await prisma.config.upsert({
    where: { key: ConfigKey.WebAuthnChallenge },
    update: { value: options.challenge },
    create: { key: ConfigKey.WebAuthnChallenge, value: options.challenge },
  });
  ctx.body = createRes(options);
});

authRouter.post('/webauthn/verify-register', async (ctx) => {
  const { body } = ctx.request;

  const expectedChallenge: string = await prisma.config.findFirst({ where: { key: ConfigKey.WebAuthnChallenge } })
    .then((row) => row.value);

  let verification: VerifiedRegistrationResponse | null = null;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: [origin, 'http://localhost:5173'],
      expectedRPID: rpID,
      requireUserVerification: false,
    });
  } catch (error) {
    console.error(error);
    ctx.body = createRes(null, 400, `注册设备失败:${error.message}`);
    return;
  }

  const { verified, registrationInfo } = verification;

  const {
    credentialPublicKey,
    credentialID,
    counter,
    credentialDeviceType,
    credentialBackedUp,
  } = registrationInfo;

  const newAuthenticator = {
    credentialID: base64url.encode(credentialID),
    credentialPublicKey: base64url.encode(credentialPublicKey),
    counter,
    credentialDeviceType,
    credentialBackedUp,
    // `body` here is from Step 2
    transports: body.response.transports,
  };

  const authenticators = await prisma.config.findFirst({ where: { key: ConfigKey.WebauthnAuthenticators } })
    .then((row) => {
      if (!row) return [];
      return JSON.parse(row.value);
    });
  authenticators.push(newAuthenticator);
  await prisma.config.upsert({
    where: { key: ConfigKey.WebauthnAuthenticators },
    update: { value: JSON.stringify(authenticators) },
    create: { key: ConfigKey.WebauthnAuthenticators, value: JSON.stringify(authenticators) },
  });

  ctx.body = createRes({ verified });
});

authRouter.post('/webauthn/auth-options', async (ctx) => {
  // (Pseudocode) Retrieve any of the user's previously-
  // registered authenticators
  const userAuthenticators = await prisma.config.findFirst({
    where: { key: ConfigKey.WebauthnAuthenticators },
  }).then((row) => (row ? JSON.parse(row.value) : []));

  const options = await generateAuthenticationOptions({
    rpID,
    // Require users to use a previously-registered authenticator
    allowCredentials: userAuthenticators.map((authenticator) => ({
      id: base64url.decode(authenticator.credentialID),
      type: 'public-key',
      transports: authenticator.transports,
    })),
    userVerification: 'preferred',
  });

  // (Pseudocode) Remember this challenge for this user
  await prisma.config.upsert({
    where: { key: ConfigKey.WebAuthnChallenge },
    create: { key: ConfigKey.WebAuthnChallenge, value: options.challenge },
    update: { value: options.challenge },
  });

  ctx.body = createRes(options);
});

authRouter.post('/webauthn/auth-verify', async (ctx) => {
  const { body } = ctx.request;

  // (Pseudocode) Get `options.challenge` that was saved above
  const [expectedChallenge, authenticator] = await Promise.all([
    prisma.config.findFirst({ where: { key: ConfigKey.WebAuthnChallenge } })
      .then((row) => row.value),
    prisma.config.findFirst({ where: { key: ConfigKey.WebauthnAuthenticators } })
      .then((record) => {
        if (!record) return null;
        const authenticators = JSON.parse(record.value);
        for (let i = 0; i < authenticators.length; i += 1) {
          const authenticator = authenticators[i];
          const matched = authenticator.credentialID === body.id;
          if (matched) {
            return authenticator;
          }
        }
      }),
  ]);

  if (!authenticator) {
    throw new Error(`Could not find authenticator ${body.id}`);
  }

  let verification: VerifiedAuthenticationResponse | null = null;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: [origin, 'http://localhost:5173'],
      expectedRPID: rpID,
      authenticator: {
        ...authenticator,
        credentialID: base64url.decode(authenticator.credentialID),
        credentialPublicKey: base64url.decode(authenticator.credentialPublicKey),
      },
      requireUserVerification: false,
    });
  } catch (error) {
    console.error(error);
    ctx.body = createRes(null, 400, `登录失败:${error.message}`);
    return;
  }

  const { verified, authenticationInfo } = verification;
  if (!verified) {
    ctx.body = createRes(null, 403, '登录失败');
    return;
  }

  const { newCounter } = authenticationInfo;

  const authenticators = await prisma.config.findFirst({ where: { key: ConfigKey.WebauthnAuthenticators } })
    .then((row) => {
      if (!row) return [];
      return JSON.parse(row.value);
    });
  const target = authenticators.find((item) => item.credentialID === body.id);
  if (target) {
    target.counter = newCounter;
  }
  prisma.config.upsert({
    where: { key: ConfigKey.WebauthnAuthenticators },
    update: { value: JSON.stringify(authenticators) },
    create: { key: ConfigKey.WebauthnAuthenticators, value: JSON.stringify(authenticators) },
  });

  ctx.body = createRes({ verified, token: await createJWT() });
});

export default authRouter;
