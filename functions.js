export const pipe = (...arg) => {
  return () => arg.reduce((acc, func) => {
    return func(acc);
  }, 0)
}

export const getRandomInt = (max) => Math.floor(Math.random() * max);
