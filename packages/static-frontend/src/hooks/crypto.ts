import type { IArticle } from "@/const"
import { decrypt, encrypt, getPrivateKey, importPublicKey } from "@/utils/crypto"
import { fetchPublicKey } from "./github"

const createArticleDecrypter = () => {
  const privateKey = getPrivateKey()
  return async (article: IArticle) => {
    if (!article.encrypted) return article
    return {
      ...article,
      content: await decrypt(article.content, await privateKey)
    }
  }
}

const createArticleEncrypter = () => {
  const publicKey = fetchPublicKey().then(data => importPublicKey(data!.publicKey))
  return async (article: IArticle, options: { crypto: boolean }) => {
    if (!options.crypto) return { ...article, encrypt: false }
    return {
      ...article,
      content: await encrypt(article.content, await publicKey),
      encrypted: true
    }
  }
}

export const decryptArticle = createArticleDecrypter()
export const encryptArticle = createArticleEncrypter()