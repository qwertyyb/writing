import { Attribute } from "@prisma/client"
import { createLogger } from "./logger.ts"
import { IWritingAttribute } from "@writing/types"

const logger = createLogger('utils')

export const createRes = <D extends any>(data: D, errCode = 0, errMsg = 'ok') => {
  return {
    errCode,
    errMsg,
    data
  }
}

export const retryWhenError = <F extends (...args: any[]) => Promise<any>>(
  fn: F,
  options = {
    interval: 3000,
    step: 1000,
    max: 10
  }
) => {
  return async (...args: Parameters<F>) => {
    for (let i = 1; i <= options.max; i += 1) {
      try {
        return await fn(...args)
      } catch (err) {
        logger.e(`retry times: ${i}, retry error: ${err.message}, `, JSON.stringify(args))
        continue
      }
    }
    logger.i(`retry failed for ${JSON.stringify(args)}`)
  }
}

export const parseAttr = (attr: Attribute): IWritingAttribute => {
  return { ...attr, options: attr.options ? JSON.parse(attr.options) : attr.options }
}