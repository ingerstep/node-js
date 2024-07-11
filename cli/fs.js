import { rimraf } from "rimraf";
import { promises as fs } from "fs";
import { mkdirp } from "mkdirp";
import { walk } from "walk";

import chalk from "chalk";
import path from "path";
import Table from "cli-table";
import DraftLog from "draftlog";

DraftLog(console);

const printDirs = (dir) =>
  new Promise((resolve) => {
    const table = new Table({
      head: ["Path", "Created"],
      colWidths: [60, 40],
    });
    const walker = walk(dir);

    walker.on("directory", (root, dirStats, next) => {
      table.push([
        "📁 " +
          path.join(chalk.gray.italic(root), chalk.blue.bold(dirStats.name)),
        dirStats.ctime,
      ]);
      next();
    });

    walker.on("end", () => {
      console.log(table.toString());
      resolve();
    });
  });

const progress = () =>
  new Promise((resolve) => {
    const log = console.draft("Starting soon...");

    let i = 0;

    const intervalId = setInterval(() => {
      i++;

      if (i === 4) {
        clearInterval(intervalId);
        log("Starting now");
        resolve();
      } else {
        log(`Starting in ${4 - i}s`);
      }
    }, 1000);
  });

(async () => {
  await progress()
  await rimraf("tmp");

  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      await mkdirp(`./tmp/a${i}/b${j}`);
      await fs.writeFile(
        `./tmp/a${i}/b${j}/t${i}${j}.txt`,
        `${i} ${j}`,
        "utf-8"
      );
    }
  }
  await printDirs("./tmp");
})();
