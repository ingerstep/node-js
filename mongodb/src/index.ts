import dotenv from "dotenv";
import express from "express";
import nunjucks from "nunjucks";
import { MongoClient, ObjectId } from "mongodb";
import cookieParser from 'cookie-parser'
import bodyParser from "body-parser";

import type { Request, Response, NextFunction } from 'express'
import type { Db, WithId } from 'mongodb'
import { nanoid } from "nanoid";

interface RequestWithDb extends Request {
  db?: Db;
  user?: WithId<Document>;
  sessionId?: string;
}

dotenv.config();

const app = express()

app.use(express.json())


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

nunjucks.configure("views", {
  autoescape: true,
  express: app,
});

app.set("view engine", "njk");

app.use(cookieParser());

const auth = () => async (req: RequestWithDb, res: Response, next: NextFunction) => {
  if (!req.cookies["sessionId"] || !req.db) {
    return next();
  }

  const user = await findUserBySessionId(req.db, req.cookies["sessionId"]);

  req.user = user as WithId<Document>;
  req.sessionId = req.cookies["sessionId"];

  next();
};

app.get("/", auth(), (req: RequestWithDb, res: Response) => {
  res.render("index", {
    user: req.user,
    authError: req.query.authError === "true",
  });
});

app.post(
  "/login",
  bodyParser.urlencoded({ extended: false }),
  async (req: RequestWithDb, res: Response) => {
    if (!req.db) {
      return
    }

    const { username, password } = req.body;
    const user = await findUserByUsername(req.db, username);

    if (!user || user.password !== password) {
      return res.redirect("/?authError=true");
    }

    const sessionId = await createSession(req.db, user._id);

    res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
  }
);

app.post("/api/add-book", auth(), async (req: RequestWithDb, res: Response) => {
  if (!req.user) {
    return res.sendStatus(401);
  }

  if (!req.db) {
    return
  }

  const db = req.db

  const response = await db.collection("users").findOneAndUpdate({
    _id: new ObjectId(req.user._id)
  }, {
    $inc: { books: 1 }
  }, { returnDocument: 'after' })

  res.json({ books: response });
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

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
})