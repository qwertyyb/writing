export const useStorage = <T extends any>() => {
  let data: T | null = null

  const setData = (savedData: T) => {
    data = savedData
  }

  return { data, setData }
}