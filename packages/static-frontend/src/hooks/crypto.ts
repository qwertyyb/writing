import type { IArticle } from "@/const"
import { decrypt, encrypt, getPrivateKey, importPublicKey } from "@/utils/crypto"
import { fetchPublicKey } from "./github"

const createArticleDecrypter = () => {
  let privateKey: Promise<CryptoKey>
  return async (article: IArticle) => {
    if (!article.encrypted) return article
    if (!privateKey) {
      privateKey = getPrivateKey()
    }
    return {
      ...article,
      content: await decrypt(article.content, await privateKey)
    }
  }
}

const createArticleEncrypter = () => {
  let publicKey: Promise<CryptoKey>
  return async (article: IArticle, options: { crypto: boolean }) => {
    if (!options.crypto) return { ...article, encrypted: false }
    if (!publicKey) {
      publicKey = fetchPublicKey().then(data => importPublicKey(data!.publicKey))
    }
    return {
      ...article,
      content: await encrypt(article.content, await publicKey),
      encrypted: true
    }
  }
}

export const decryptArticle = createArticleDecrypter()
export const encryptArticle = createArticleEncrypter()