import fetch from "node-fetch";

const factorial = (n) => {
  if (n === 0) return 1;
  return n * factorial(n - 1);
};

const logAndReturn = (prefix) => (arg) => {
  console.log(prefix, arg);
  return arg;
};

fetch("https://swapi.dev/api/people/?search=r2")
  .then(logAndReturn("response"))
  .then((res) => res.json())
  .then(logAndReturn("json"))
  .then((data) => data.results[0])
  .then(logAndReturn('single entry'))
  .then((data) => data.name)
  .then(console.log);
