
type LogLevel = 'info' | 'warning' | 'error'

let level: LogLevel = 'info';

export const setLevel = (l: LogLevel) => {
  level = l;
};

export const createLogger = (prefix: string = '') => ({
  i: (...args: Parameters<typeof console.info>) => {
    if (level === 'info') {
      return console.info(`[${prefix}]`, ...args);
    }
  },
  w: (...args: Parameters<typeof console.info>) => {
    if (level === 'info' || level === 'warning') {
      return console.warn(`[${prefix}]`, ...args);
    }
  },
  e: (...args: Parameters<typeof console.info>) => {
    if (level === 'info' || level === 'warning' || level === 'error') {
      return console.error(`[${prefix}]`, ...args);
    }
  },
});
