import { createReadStream } from "fs";
import { Transform } from "stream";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const capitalize = new Transform({
  transform(chunk, encoding, callback) {
    callback(null, chunk.toString().toUpperCase());
  },
});

const doubleNewlines = new Transform({
  transform(chunk, encoding, callback) {
    callback(null, chunk.toString().replace(/\n/g, "\n\n"));
  },
});

const logAndReturn = (prefix) =>
  new Transform({
    transform(chunk, encoding, callback) {
      console.log(prefix, chunk.toString());
      callback(null, chunk);
    },
  });

const fileStream = createReadStream(__filename, "utf8");

fileStream
  .pipe(logAndReturn("initial"))
  .pipe(capitalize)
  .pipe(logAndReturn("after capitalize"))
  .pipe(doubleNewlines)
  .pipe(logAndReturn("after newlines"))
  .pipe(process.stdout);
