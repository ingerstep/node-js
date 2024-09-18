const fib = (n) => {
  if (n < 0) throw new Error(`Invalid index ${n}`);
  if (n !== Math.floor(n)) throw new Error(`Invalid index ${n}`);
  if (n < 2) return 1;
  return fib(n - 1) + fib(n - 2);
};

const fibGen = function* () {
  let a = 1;
  let b = 1;
  while (true) {
    yield a;
    const c = a + b;
    a = b;
    b = c;
  }
};

module.exports = {
  fib,
  fibGen,
};
