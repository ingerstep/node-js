import { pick } from "lodash";
import express from "express";

const db = require("./db");

const router = express.Router();

router.get("/", async (req, res) => {
  await db.createCollection("users");
  const users = await db.find("users", req.query);
  res.json(users);
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await db.createCollection("users");
    const users = await db.get("users", req.query);
    res.json(users);
  } catch (error) {
    if (error.code === db.NO_ENTITY) {
      res.status(404).send(`Unknown user ID: ${id}`);
      return;
    }
    throw error;
  }
});

router.post("/", async (req, res) => {
  await db.createCollection("users");
  const id = await db.create("users", pick(req.body, "name", "country", "age"));
  res
    .header("Location", `${req.protocol}://${req.hostname}/api/users/${id}`)
    .sendStatus(201);
});

router.patch("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await db.createCollection("users");
    const updateData = pick(req.body, "name", "country", "age");
    await db.update("users", id, updateData);
    res.sendStatus(204);
  } catch (error) {
    if (error.code === db.NO_ENTITY) {
      res.status(404).send(`Unknown user ID: ${id}`);
      return;
    }
    throw error;
  }
});

router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await db.createCollection("users");
    await db.delete("users", id);
    res.sendStatus(204);
  } catch (error) {
    if (error.code === db.NO_ENTITY) {
      res.status(404).send(`Unknown user ID: ${id}`);
      return;
    }
    throw error;
  }
});

module.exports = router