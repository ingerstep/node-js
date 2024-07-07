import express from "express";
import nunjucks from "nunjucks";
import { nanoid } from "nanoid";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { configDotenv } from "dotenv";
import knex from "knex";

import { hash } from "./utils.js";

configDotenv();

const app = express();

const db = knex({
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
});

//DB actions

const findUserByUsername = async (username) =>
  db("users")
    .select()
    .where({ username })
    .limit(1)
    .then((results) => results[0]);

const findUserBySessionId = async (sessionId) => {
  const session = await db("sessions")
    .select("user_id")
    .where({ session_id: sessionId })
    .limit(1)
    .then((results) => results[0]);

  if (!session) {
    return;
  }

  return db("users")
    .select()
    .where({ id: session.user_id })
    .limit(1)
    .then((results) => results[0]);
};

//session actions

const createSession = async (userId) => {
  const sessionId = nanoid();

  await db("sessions").insert({
    user_id: userId,
    session_id: sessionId,
  });

  return sessionId;
};

const deleteSession = async (sessionId) => {
  await db("sessions").where({ session_id: sessionId }).delete();
};

//template engine config

nunjucks.configure("views", {
  autoescape: true,
  express: app,
  tags: {
    blockStart: "[%",
    blockEnd: "%]",
    variableStart: "[[",
    variableEnd: "]]",
    commentStart: "[#",
    commentEnd: "#]",
  },
});

app.set("view engine", "njk");

//middleware

app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());

const auth = () => async (req, res, next) => {
  if (!req.cookies["sessionId"]) {
    return next();
  }

  const user = await findUserBySessionId(req.cookies["sessionId"]);

  req.user = user;
  req.sessionId = req.cookies["sessionId"];

  next();
};

//auth requests

app.get("/", auth(), (req, res) => {
  res.render("index", {
    user: req.user,
    authError: req.query.authError === "true" ? "Wrong username or password" : req.query.authError,
  });
});

app.post("/login", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  const user = await findUserByUsername(username);

  if (!user || user.password !== hash(password).toString()) {
    return res.redirect("/?authError=true");
  }

  const sessionId = await createSession(user.id);

  res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
});

app.post("/signup", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  const user = await findUserByUsername(username);

  if (user) {
    return res.redirect("/?authError=true");
  }

  const newUser = {
    username,
    password: hash(password).toString(),
  };

  const [createdUser] = await db("users").insert(newUser).returning("*");

  const sessionId = await createSession(createdUser.id);

  res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
});

app.get("/logout", auth(), async (req, res) => {
  if (!req.user) {
    return res.redirect("/");
  }

  await deleteSession(req.sessionId);

  res.clearCookie("sessionId").redirect("/");
});

//timers requests

app.get("/api/timers", async (req, res) => {
  const isActive = req.query.isActive === "true";
  const filteredTimers = await db("timers").select().where({ is_active: isActive });

  res.json(filteredTimers);
});

app.post("/api/timers", async (req, res) => {
  const { description } = req.body;

  const newTimer = {
    start: new Date(),
    description,
    is_active: true,
  };

  await db("timers").insert(newTimer);
  res.json(newTimer);
});

app.post("/api/timers/:id/stop", async (req, res) => {
  const timer = await db("timers").select().where({ id: req.params.id }).first();

  if (timer && timer.is_active) {
    const endTime = new Date();
    const duration = new Date(endTime).getTime() - new Date(timer.start).getTime();

    await db("timers").where({ id: req.params.id }).update({ is_active: false, end: endTime, duration });

    timer.is_active = false;
    timer.end = endTime;
    timer.duration = duration;
  }

  res.json(timer);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
