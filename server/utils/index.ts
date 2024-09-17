import { createLogger } from "./logger"

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