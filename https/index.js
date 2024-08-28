require("dotenv").config();

const https = require("https");
const fs = require("fs");
const path = require("path");
const express = require("express");

const keysFolder = path.resolve(__dirname, process.env.KEYS_FOLDER);

const options = {
  key: fs.readFileSync(path.join(keysFolder, "key.pem")),
  cert: fs.readFileSync(path.join(keysFolder, "cert.pem")),
};

const app = express()

app.get("/", (req, res) => {
    res.send("hello from express")
})

const PORT = 9000;

https
  .createServer(options, app)
  .listen(PORT, () => {
    console.log(`  Listening https://localhost:${PORT}`);
  });
