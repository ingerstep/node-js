import express from "express";
import nunjucks from "nunjucks";
import { MongoClient, ObjectId } from "mongodb";
import cookieParser from 'cookie-parser'
import bodyParser from "body-parser";

import type { Request, Response, NextFunction } from 'express'
import type { Db, WithId } from 'mongodb'
import { nanoid } from "nanoid";
import { configDotenv } from "dotenv";

import { hash } from "./utils";

interface RequestWithDb extends Request {
  db?: Db;
  user?: WithId<Document>;
  sessionId?: string;
}

configDotenv()

const app = express()

//DB actions

const clientPromise = MongoClient.connect(process.env.DB_URI as string, {
  maxPoolSize: 10,
});

app.use(async (req: RequestWithDb, res: Response, next: NextFunction) => {
  try {
    const client = await clientPromise;
    req.db = client.db("users");
    next();
  } catch (error) {
    next(error);
  }
})

const findUserByUsername = async (db: Db, username: string) =>
  db.collection("users")
    .findOne({ username })

const findUserBySessionId = async (db: Db, sessionId: string) => {
  const session = await db.collection("sessions")
    .findOne({ sessionId }, {
      projection: { userId: 1 }
    })

  if (!session) {
    return;
  }

  return db.collection("users")
    .findOne({ _id: new ObjectId(session.userId) })
};

//session actions

const createSession = async (db: Db, userId: ObjectId) => {
  const sessionId = nanoid();

  await db.collection("sessions").insertOne({
    userId,
    sessionId,
  });

  return sessionId;
};

const deleteSession = async (db: Db, sessionId: string) => {
  await db.collection("sessions").deleteOne({ sessionId });
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

app.use(express.json())
app.use(express.static("public"));
app.use(cookieParser());

const auth = () => async (req: RequestWithDb, res: Response, next: NextFunction) => {
  if (!req.cookies["sessionId"]) {
    return next();
  }

  const db = req.db

  if (!db) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const user = await findUserBySessionId(db, req.cookies["sessionId"]);

  req.user = user as WithId<Document>;
  req.sessionId = req.cookies["sessionId"];

  next();
};

//auth requests

app.get("/", auth(), (req: RequestWithDb, res: Response) => {
  res.render("index", {
    user: req.user,
    authError: req.query.authError === "true" ? "Wrong username or password" : req.query.authError,
  });
});

app.post(
  "/login",
  bodyParser.urlencoded({ extended: false }),
  async (req: RequestWithDb, res: Response) => {
    const db = req.db

    if (!db) {
      return res.status(500).json({ error: "Database not initialized" });
    }

    const { username, password } = req.body;
    const user = await findUserByUsername(db, username);

    if (!user || user.password !== hash(password).toString()) {
      return res.redirect("/?authError=true");
    }

    const sessionId = await createSession(db, user._id);

    res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
  }
);

app.post("/signup", bodyParser.urlencoded({ extended: false }), async (req: RequestWithDb, res: Response) => {
  const db = req.db

  if (!db) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const { username, password } = req.body;
  const user = await findUserByUsername(db, username);

  if (user) {
    return res.redirect("/?authError=true");
  }

  const newUser = {
    username,
    password: hash(password).toString(),
  };

  const createdUser = await db.collection("users").insertOne(newUser);
  const createdUserId = createdUser.insertedId

  const sessionId = await createSession(db, createdUserId);

  res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
});

app.get("/logout", auth(), async (req: RequestWithDb, res: Response) => {
  if (!req.user) {
    return res.redirect("/");
  }

  if (!req.db || !req.sessionId) {
    return
  }

  await deleteSession(req.db, req.sessionId);

  res.clearCookie("sessionId").redirect("/");
});

//timers requests

app.get("/api/timers", async (req: RequestWithDb, res: Response) => {
  const isActive = req.query.isActive === "true";

  const db = req.db

  if (!db) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const filteredTimers = await db?.collection("timers").find({ isActive }).toArray()

  res.json(filteredTimers)
});

app.post("/api/timers", async (req: RequestWithDb, res: Response) => {
  const { description } = req.body;
  const db = req.db

  if (!db) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const newTimer = {
    start: new Date(),
    description,
    isActive: true,
  };

  await db?.collection("timers").insertOne(newTimer);
  res.json(newTimer);
});

app.post("/api/timers/:id/stop", async (req: RequestWithDb, res: Response) => {
  const db = req.db

  if (!db) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const timer = await db.collection("timers").findOne({ _id: new ObjectId(req.params.id) })

  if (timer && timer.isActive) {
    const endTime = new Date();
    const duration = new Date(endTime).getTime() - new Date(timer.start).getTime();

    await db?.collection("timers").findOneAndUpdate({ _id: new ObjectId(req.params.id) }, { $set: { isActive: false, end: endTime, duration } }, { returnDocument: 'after' })
  }

  res.json(timer);
});

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
})
