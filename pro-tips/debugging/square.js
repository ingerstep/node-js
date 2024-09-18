import lodash from "lodash"; // Import lodash as default
const { flowRight } = lodash;

const square = (x) => x * x;
const plusOne = (x) => x + 1;

const logAndReturn = (prefix) => (arg) => {
  console.log(prefix, arg);
  return arg;
};

console.log(
  flowRight(
    logAndReturn(6),
    square,
    logAndReturn(5),
    plusOne,
    logAndReturn(4),
    square,
    logAndReturn(3),
    plusOne,
    logAndReturn(2),
    square,
    logAndReturn(1),
    plusOne
  )(10)
);
