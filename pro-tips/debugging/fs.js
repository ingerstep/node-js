import debug from "debug";
import { appendFileSync, writeFileSync } from "fs";

const debugFibonacci = debug("fibonacci");
const debugFactorial = debug("factorial");

writeFileSync("./fibonacci.txt", "");

let a = 1;
let b = 1;
setInterval(() => {
  debugFibonacci(a);
  appendFileSync("./fibonacci.txt", `${a}\n`);
  const c = a + b;
  a = b;
  b = c;
}, 500);

writeFileSync("./factorial.txt", "");

let f = 1;
let n = 0;
setInterval(() => {
  debugFactorial(f);
  appendFileSync("./factorial.txt", `${f}\n`);
  n += 1;
  f *= n;
}, 500);
