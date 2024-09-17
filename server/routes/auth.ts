import type Koa from 'koa';
import KoaRouter from '@koa/router';
import { base64url, EncryptJWT } from 'jose';
import {
  generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse,
  type VerifiedRegistrationResponse, type VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import { createRes } from '../utils/index.ts';
import { JWT_SECRET } from '../config.ts';
import { prisma } from '../prisma.ts';
import { checkLogin } from '../middlewares/auth.ts';
import { ConfigKey, ORIGIN, RP_ID, RP_NAME, USER_ID, USER_NAME } from '../const.ts';
import { createHash } from 'node:crypto';

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

const canRegister = async (ctx: Koa.Context) => {
  if (await checkLogin(ctx)) {
    return true;
  }
  const row = await prisma.config.findUnique({ where: { key: ConfigKey.Password }});
  if (row) {
    return false;
  }
  const authenticators = await prisma.config.findFirst({ where: { key: ConfigKey.WebauthnAuthenticators } })
    .then((record) => {
      if (!record) return [];
      return JSON.parse(record.value);
    });
  if (authenticators.length) {
    return false;
  }
  return true;
};

authRouter.get('/check', async (ctx) => {
  const isLogin = await checkLogin(ctx);
  ctx.body = createRes({ isLogin });
});

authRouter.post('/register', async (ctx) => {
  const canDo = canRegister(ctx);
  if (!canDo) {
    return ctx.body = createRes(null, 403, '此操作不可用');
  }
  const password = ctx.request.body.password as string;
  if (!password) {
    return ctx.body = createRes(null, 400, '未输入密码');
  }
  const hashedPassword = createHash('sha256')
    .update(password)
    .digest('base64');
  await prisma.config.upsert({
    where: { key: ConfigKey.Password },
    create: { key: ConfigKey.Password, value: hashedPassword },
    update: { value: password }
  });
  ctx.body = createRes({ success: true });
});

authRouter.post('/login', async (ctx) => {
  const { password } = ctx.request.body;
  if (!password) {
    ctx.body = createRes(null, 400, '未传入密码');
    return;
  }
  const hashedPassword = createHash('sha256')
    .update(password)
    .digest('base64');
  const rows = await prisma.config.findMany({
    where: {
      key: {
        in: [ConfigKey.PasswordDisabled, ConfigKey.Password]
      }
    }
  });
  const disabledRow = rows.find(row => row.key === ConfigKey.PasswordDisabled);
  const disabled = !!disabledRow?.value;
  if (disabled) {
    ctx.body = createRes(null, 500, '已禁用密码登录');
    return;
  }
  const token = rows.find(row => row.key === ConfigKey.Password)?.value;
  if (!token) {
    ctx.body = createRes(null, 500, '密码未设置');
    return;
  }
  if (hashedPassword !== token) {
    ctx.body = createRes(null, 400, '密码不正确');
    return;
  }
  const jwt = await createJWT();

  ctx.body = createRes({ token: jwt });
});

authRouter.get('/can-register', async (ctx) => {
  const canDo = await canRegister(ctx);
  ctx.body = createRes({ canRegister: canDo });
});

authRouter.post('/webauthn/register-options', async (ctx) => {
  const authenticators = await prisma.config.findFirst({ where: { key: ConfigKey.WebauthnAuthenticators } })
    .then((record) => {
      if (!record) return [];
      return JSON.parse(record.value);
    });
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: USER_ID,
    userName: USER_NAME,
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
      authenticatorAttachment: 'platform',
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
  const { name, body } = ctx.request.body;

  const expectedChallenge: string = await prisma.config.findFirst({ where: { key: ConfigKey.WebAuthnChallenge } })
    .then((row) => row.value);

  let verification: VerifiedRegistrationResponse | null = null;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: [ORIGIN, 'http://localhost:5173'],
      expectedRPID: RP_ID,
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
    name,
    createdAt: Date.now(),
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
    rpID: RP_ID,
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
      expectedOrigin: [ORIGIN, 'http://localhost:5173'],
      expectedRPID: RP_ID,
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