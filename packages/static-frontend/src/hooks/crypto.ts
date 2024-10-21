import { type IArticle } from "@/const"
import { Buffer } from "buffer"
import { adminConfig } from "./admin"

export const generateKey = async () => {
  const key = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
  const exportedKey = await window.crypto.subtle.exportKey('raw', key)
  return Buffer.from(exportedKey).toString('base64')
}

export const importKey = (keystr: string) => {
  return window.crypto.subtle.importKey(
    'raw',
    Buffer.from(keystr, 'base64').buffer,
    "AES-GCM",
    true,
    [
      "encrypt",
      "decrypt",
    ]
  );
}

export const getCryptoKey = () => {
  const keystr = adminConfig.value.cryptoKey || ''
  if (!keystr) throw new Error('未找到密钥')
  return importKey(keystr)
}

export const encrypt = async (content: string, key: CryptoKey) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const buffer = new TextEncoder().encode(content)
  const encryptedData = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buffer)
  return {
    iv: Buffer.from(iv).toString('base64'),
    encryptedData: Buffer.from(encryptedData).toString('base64')
  }
}

export const checkKey = async (keystr: string) => {
  const key = await importKey(keystr)
  const original = window.crypto.randomUUID()
  const { iv, encryptedData } = await encrypt(original, key)
  console.log(iv, encryptedData)
  return original === await decrypt(encryptedData, iv, key)
}

export const decrypt = async (encryptedData: string, iv: string, key: CryptoKey | string) => {
  const cryptoKey = typeof key === 'string' ? await importKey(key) : key
  const result = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: Buffer.from(iv, 'base64').buffer },
    cryptoKey,
    Buffer.from(encryptedData, 'base64').buffer
  );
  return new TextDecoder().decode(result)
}

export const encryptArticle = async (article: IArticle, options: { crypto: boolean }) => {
  if (!options.crypto) return { ...article, iv: '', encrypted: false }
  const { iv, encryptedData: content } = await encrypt(article.content, await getCryptoKey())
  return {
    ...article,
    content,
    iv,
    encrypted: true
  }
}

export const decryptArticle = async (article: IArticle) => {
  if (!article.encrypted) return article
  const content = await decrypt(article.content, article.iv!, await getCryptoKey())
  return {
    ...article,
    content,
  }
}
