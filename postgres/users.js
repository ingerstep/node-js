const express = require("express");
const pick = require("lodash/pick");

const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
});

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const users = await knex.select().table("users").where(req.query);
    res.json(users);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const user = await knex
      .select()
      .table("users")
      .where({ id })
      .then((data) => data[0]);

    if (user) {
      res.json(user);
    } else {
      res.status(404).send(`Unknown user ID: ${id}`);
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
});

router.post("/", async (req, res) => {
  try {
    const data = pick(req.body, "name", "age", "country");
    const [id] = await knex("users").insert(data).returning("id");

    res
      .header("Location", `${req.protocol}://${req.hostname}/api/users/${id}`)
      .sendStatus(201);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

router.patch("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const data = pick(req.body, "name", "age", "country");
    const updateCount = await knex("users").where({ id }).update(data);

    if (updateCount === 0) {
      res.status(404).send(`Unknown user ID: ${id}`);
    } else {
      res.sendStatus(204);
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
});

router.delete("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const deleteCount = await knex("users").where({ id }).delete();

    if (deleteCount === 0) {
      res.status(404).send(`Unknown user ID: ${id}`);
    } else {
      res.sendStatus(204);
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
});

module.exports = router;
