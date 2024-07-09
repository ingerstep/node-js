import dotenv from "dotenv";
import express from "express";
import type { Request, Response, NextFunction } from 'express'

dotenv.config();

const app = express()

app.use(express.json())
app.use("/api/users", require("./users"))

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).send(err.message)
})

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
})