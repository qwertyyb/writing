export const createRes = <D>(data: D, errCode = 0, errMsg = 'ok') => ({
  errCode,
  errMsg,
  data,
});
