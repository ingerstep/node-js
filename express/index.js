const { configDotenv } = require("dotenv");
const e = require("express");
const basicAuth = require("express-basic-auth");

configDotenv()

const app = e();

app.use(
  basicAuth({
    realm: "Web.",
    challenge: true,
    users: {
      admin: process.env.PASSWORD,
    },
  })
);

app.get("/", (req, res) => {
  res.send("Welcome");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
