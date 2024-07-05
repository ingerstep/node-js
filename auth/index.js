import express from "express";
import nunjucks from "nunjucks";
import { nanoid } from "nanoid";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

import { TIMERS } from "./constants.js";
import { hash } from "./utils.js";

const app = express();

const DB = {
  users: [
    {
      _id: nanoid(),
      username: "admin",
      password: hash("pwd007").toString(),
    },
  ],
  sessions: {},
  timers: TIMERS,
};

//DB actions

const findUserByUsername = async (username) => DB.users.find((u) => u.username === username);

const findUserBySessionId = async (sessionId) => {
  const userId = DB.sessions[sessionId];

  if (!userId) {
    return;
  }

  return DB.users.find((u) => u._id === userId);
};

//session actions

const createSession = async (userId) => {
  const sessionId = nanoid();

  DB.sessions[sessionId] = userId;

  return sessionId;
};

const deleteSession = async (sessionId) => {
  delete DB.sessions[sessionId];
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

  const sessionId = await createSession(user._id);

  res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
});

app.post("/signup", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  const user = await findUserByUsername(username);

  if (user) {
    return res.redirect("/?authError=true");
  }

  const newUser = {
    _id: nanoid(),
    username,
    password: hash(password).toString(),
  };

  DB.users.push(newUser);

  const sessionId = await createSession(newUser._id);

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

app.get("/api/timers", (req, res) => {
  const isActive = req.query.isActive === "true";
  const filteredTimers = TIMERS.filter((timer) => timer.isActive === isActive);

  res.json(filteredTimers);
});

app.post("/api/timers", (req, res) => {
  const { description } = req.body;

  const newTimer = {
    start: Date.now(),
    description,
    isActive: true,
    id: nanoid(),
  };

  TIMERS.push(newTimer);
  res.json(newTimer);
});

app.post("/api/timers/:id/stop", (req, res) => {
  const timer = TIMERS.find((t) => t.id === req.params.id);

  if (timer && timer.isActive) {
    timer.isActive = false;
    timer.end = Date.now();
    timer.duration = timer.end - timer.start;
  }

  res.json(timer);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
