enum LogLevel {
  Debug = 1,
  Info = 2,
  Warning = 3,
  Error = 4
}

let level: LogLevel = LogLevel.Debug

export const setLevel = (l: LogLevel) => {
  level = l
}

export const createLogger = (prefix: string = '') => ({
  i: (...args: Parameters<typeof console.info>) => {
    if (level >= LogLevel.Info) {
      return console.info(`[${prefix}]`, ...args)
    }
  },
  w: (...args: Parameters<typeof console.info>) => {
    if (level >= LogLevel.Warning) {
      return console.warn(`[${prefix}]`, ...args)
    }
  },
  e: (...args: Parameters<typeof console.info>) => {
    if (level >= LogLevel.Error) {
      return console.error(`[${prefix}]`, ...args)
    }
  },
  d: (...args: Parameters<typeof console.debug>) => {
    if (level >= LogLevel.Debug) {
      return console.debug(`[${prefix}]`, ...args)
    }
  }
})

export const logger = createLogger()