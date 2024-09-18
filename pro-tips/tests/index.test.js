const { fib, fibGen } = require("./index.js");

describe("Fibbonaci", () => {
  describe("fib", () => {
    it("works for proper indices", () => {
      expect(fib(0)).toEqual(1);
      expect(fib(1)).toEqual(1);
      expect(fib(9)).toEqual(55);
      expect(fib(10)).toEqual(89);
    });

    it("throws for improper indices", () => {
      expect(() => fib(-50)).toThrow("Invalid index -50");
      expect(() => fib(4.7)).toThrow("Invalid index 4.7");
    });
  });

  describe("fibGen", () => {
    it("works", () => {
      const expectedNumbers = [1, 1, 2, 3, 5, 8, 13, 21];
      let index = 0;

      expect.assertions(expectedNumbers.length);

      for (const f of fibGen()) {
        if (index === expectedNumbers.length) {
          break;
        }

        expect(f).toEqual(expectedNumbers[index]);
        index++;
      }
    });
  });
});
