import express from "express";
import { nanoid } from "nanoid";
import { configDotenv } from "dotenv";
import knex from "knex";
import http from "http";
import { WebSocketServer } from "ws";

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

//middleware

app.use(express.json());
app.use(express.static("public"));

const auth = () => async (req, res, next) => {
  const sessionId = req.headers["sessionid"] || req.query.sessionId;

  if (!sessionId) {
    return next();
  }

  const user = await findUserBySessionId(sessionId);

  req.user = user;
  req.sessionId = sessionId;

  next();
};

const server = http.createServer(app);

const wss = new WebSocketServer({ server });
const clients = new Map();
let timerIntervalId;

const broadcastTimers = async () => {
  const timers = await db("timers").select().where({ is_active: true });

  const updatedTimers = timers.map((timer) => {
    const now = new Date();
    const start = new Date(timer.start);
    const duration = now.getTime() - start.getTime();
    return {
      ...timer,
      current_duration: duration,
    };
  });

  const message = JSON.stringify({ type: "active_timers", timers: updatedTimers });

  for (const ws of clients.values()) {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  }
};

wss.on("connection", (ws, req) => {
  ws.on("message", async (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (err) {
      return;
    }

    if (data.type === "login") {
      const { username, password } = data;
      const user = await findUserByUsername(username);

      if (!user) {
        return ws.send(
          JSON.stringify({
            type: "auth_error",
            error: "Unknown username",
          })
        );
      }

      if (user.password !== hash(password).toString()) {
        return ws.send(
          JSON.stringify({
            type: "auth_error",
            error: "Wrong password",
          })
        );
      }

      const sessionId = await createSession(user.id);
      clients.set(user.id, ws);

      return ws.send(
        JSON.stringify({
          type: "auth_success",
          sessionId,
        })
      );
    } else if (data.type === "all_timers") {
      const timers = await db("timers").select();

      return ws.send(
        JSON.stringify({
          type: "all_timers",
          timers,
        })
      );
    } else if (data.type === "active_timers") {
      if (timerIntervalId) {
        clearInterval(timerIntervalId);
      }
      timerIntervalId = setInterval(broadcastTimers, 1000);
    }
  });

  ws.on("close", () => {
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      timerIntervalId = null;
    }

    for (const userId of clients.keys()) {
      if (clients.get(userId) === ws) {
        clients.delete(userId);
      }
    }
  });
});

//auth requests

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await findUserByUsername(username);

  if (!user || user.password !== hash(password).toString()) {
    return res.json({ error: "User already exists" });
  }

  const sessionId = await createSession(user.id);

  res.json({ sessionId });
});

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  const user = await findUserByUsername(username);

  if (user) {
    return res.json({ error: "User already exists" });
  }

  const newUser = {
    username,
    password: hash(password).toString(),
  };

  const [createdUser] = await db("users").insert(newUser).returning("*");

  const sessionId = await createSession(createdUser.id);

  res.json({ sessionId });
});

app.get("/logout", auth(), async (req, res) => {
  if (!req.user) {
    return res.json({ error: "User not authenticated" });
  }

  await deleteSession(req.sessionId);

  res.json({});
});

//timers requests

app.get("/api/timers", async (req, res) => {
  const isActive = req.query.isActive === "true";
  const filteredTimers = await db("timers").select().where({ is_active: isActive });

  res.json(filteredTimers);
});

app.get("/api/timers/:id", async (req, res) => {
  const timerId = req.params.id;
  const filteredTimers = await db("timers").select().where({ id: timerId });

  res.json(filteredTimers);
});

app.post("/api/timers", async (req, res) => {
  const { description } = req.body;

  const newTimer = {
    start: new Date(),
    description,
    is_active: true,
  };

  const [timerId] = await db("timers").insert(newTimer).returning("id");

  res.json({ id: timerId });
});

app.post("/api/timers/:id/stop", async (req, res) => {
  const { id } = req.params;

  try {
    const timer = await db("timers").select().where({ id }).first();

    if (!timer || !timer.is_active) {
      return res.status(404).json({ error: "Timer not found or already stopped" });
    }

    const endTime = new Date();
    const duration = endTime.getTime() - new Date(timer.start).getTime();

    await db("timers").where({ id }).update({ is_active: false, end: endTime, duration });

    res.json({ success: true });
  } catch (error) {
    console.error("Error stopping timer:", error);
    res.status(500).json({ error: "Failed to stop timer" });
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});
