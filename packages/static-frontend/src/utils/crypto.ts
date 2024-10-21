import { PRIVATE_KEY, PUBLIC_KEY_PATH } from "@/const";
import { Buffer } from "buffer";

/*
将字符串转换为 ArrayBuffer
来自 https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
*/
function str2ab(str: string) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

/*
将 ArrayBuffer 转换为字符串
代码来自 https://developer.chrome.google.cn/blog/how-to-convert-arraybuffer-to-and-from-string
*/
function ab2str(buf: ArrayBuffer) {
  // @ts-ignore
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}


export function importPublicKey(pem: string) {
  // 获取 PEM 字符串在头部和尾部之间的部分
  const pemHeader = "-----BEGIN PUBLIC KEY-----";
  const pemFooter = "-----END PUBLIC KEY-----";
  const pemContents = pem.substring(
    pemHeader.length,
    pem.length - pemFooter.length,
  );
  // 将字符串通过 base64 解码为二进制数据
  const binaryDerString = window.atob(pemContents);
  // 将二进制字符串转换为 ArrayBuffer
  const binaryDer = str2ab(binaryDerString);

  return window.crypto.subtle.importKey(
    "spki",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"],
  );
}

/*
导入一个 PEM 编码的 RSA 私钥，用于 RSA-PSS 签名。
输入一个包含 PEM 编码的私钥的字符串，返回一个 Promise，
会兑现为一个表示私钥的 CryptoKey 对象。
*/
export function importPrivateKey(pem: string) {
  // 获取 PEM 字符串在头部和尾部之间的部分
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = pem.substring(
    pemHeader.length,
    pem.length - pemFooter.length,
  );
  // 将字符串通过 base64 解码为二进制数据
  const binaryDerString = window.atob(pemContents);
  // 将二进制字符串转换为 ArrayBuffer
  const binaryDer = str2ab(binaryDerString);

  return window.crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"],
  );
}

export const getPublicKey = async () => {
  const r = await fetch(PUBLIC_KEY_PATH)
  if (r.ok) {
    const t = await r.text()
    return importPublicKey(t)
  }
  throw new Error(`获取公钥失败: ${r.status}`)
}

export const getPrivateKey = async () => {
  const str = localStorage.getItem(PRIVATE_KEY)
  if (!str) throw new Error('未发现私钥')
  return importPrivateKey(str)
}

export const encrypt = async (message: string, publicKey?: CryptoKey | string) => {
  const key = typeof publicKey === 'string' ? await importPublicKey(publicKey) : (publicKey || await getPublicKey())
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const buffer = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    key,
    data
  )
  return Buffer.from(buffer).toString('base64')
}

export const decrypt = async (message: string, privateKey?: CryptoKey | string) => {
  const key = typeof privateKey === 'string' ? await importPrivateKey(privateKey) : (privateKey || await getPrivateKey())
  const result = await crypto.subtle.decrypt(
    {
      name: "RSA-OAEP"
    },
    key,
    Buffer.from(message, 'base64')
  );
  const decoder = new TextDecoder();
  return decoder.decode(result);
}

export const generateKeys = async () => {
  const keys = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096, //密钥长度，可以是1024, 2048, 4096，建议2048以上
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 公共指数e，一般用65537
      hash: "SHA-256", //可以是"SHA-1", "SHA-256", "SHA-384", "SHA-512"
    },
    true,
    ["encrypt", "decrypt"]
  );
  const [publicKey, privateKey] = await Promise.all([
    crypto.subtle.exportKey('spki', keys.publicKey),
    crypto.subtle.exportKey('pkcs8', keys.privateKey)
  ])
  const exported = {
    publicKey: `-----BEGIN PUBLIC KEY-----\n${window.btoa(ab2str(publicKey))}\n-----END PUBLIC KEY-----`,
    privateKey: `-----BEGIN PRIVATE KEY-----\n${window.btoa(ab2str(privateKey))}\n-----END PRIVATE KEY-----`
  }
  return exported
}

const exportKeys = async (keys: CryptoKeyPair) => {
  const [publicKey, privateKey] = await Promise.all([
    crypto.subtle.exportKey('spki', keys.publicKey),
    crypto.subtle.exportKey('pkcs8', keys.privateKey)
  ])
  const exported = {
    publicKey: `-----BEGIN PUBLIC KEY-----\n${window.btoa(ab2str(publicKey))}\n-----END PUBLIC KEY-----`,
    privateKey: `-----BEGIN PRIVATE KEY-----\n${window.btoa(ab2str(privateKey))}\n-----END PRIVATE KEY-----`
  }
  return exported
}

export const downloadKeys = async (keys: { publicKey: string, privateKey: string }) => {
  const { saveAs } = await import('file-saver')
  const privBlob = new Blob([keys.privateKey], {type: "text/plain;charset=utf-8"})
  saveAs(privBlob, location.host + '.privateKey.pem')
  const pubBlob = new Blob([keys.publicKey], {type: "text/plain;charset=utf-8"})
  saveAs(pubBlob, location.host + '.publicKey.pem')
}

export const test = async () => {
  const keys = await generateKeys()
  const publicKey = await importPublicKey(keys.publicKey)
  const privateKey = await importPrivateKey(keys.privateKey)
  const message = 'hello, world'
  const encryptedData = await encrypt(message, publicKey)
  console.log('encryptedData', encryptedData)
  const result = await decrypt(encryptedData, privateKey)
  console.log('result', result)
}
