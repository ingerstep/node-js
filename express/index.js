import express from "express";

const app = express();

app.use(express.json());

app.use("/api/users", require("./users"));

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
});

const PORT = process.env.PORT | 3000;

app.listen(PORT, () => {
  console.log(`Listening on port http://localhost:${PORT}`);
});
