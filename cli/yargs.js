const args = require("yargs")
  .usage("Usage: $0 <command> [options]")
  .command("count", "Count lines in a file")
  .example("$0 count -f foo.js", "count the lines in the given file")
  .alias("f", "file")
  .nargs("f", 1)
  .describe("f", "Path to the file")
  .demandOption("f")

  .help("h")
  .alias("h", "help").argv;

const fs = require("fs");

const lines = fs.readFileSync(args.file, "utf-8").trim().split("\n").length;

console.log(lines);
