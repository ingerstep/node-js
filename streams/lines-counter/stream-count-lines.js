const fs = require("fs");

let count = 0;

fs.createReadStream("war-and-peace.txt", "utf-8")
  .on("data", (chunk) => {
    console.log("New chunk");
    count += chunk.split("\n").length - 1;
  })
  .on("end", () => {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;

    console.log(`Memory usage ~${Math.round(used * 100) / 100} MB`);
    
    console.log(count);
  });
