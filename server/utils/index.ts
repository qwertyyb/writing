export const createRes = <D extends any>(data: D, errCode = 0, errMsg = 'ok') => {
  return {
    errCode,
    errMsg,
    data
  }
}