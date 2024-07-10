import type { Db } from 'mongodb'
import { MongoClient, ObjectId } from "mongodb";
import express from "express";
import type { Request, Response, NextFunction } from 'express'
import pick from 'lodash/pick'

interface RequestWithDb extends Request {
  db?: Db;
}

const clientPromise = MongoClient.connect(process.env.DB_URI as string, {
  maxPoolSize: 10,
});

const router = express.Router();

router.use(async (req: RequestWithDb, res: Response, next: NextFunction) => {
  try {
    const client = await clientPromise;
    req.db = client.db("users");
    next();
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req: RequestWithDb, res: Response) => {
  try {
    if (!req.db) {
      throw new Error("Database not initialized")
    }

    const users = await req.db.collection("users").find(req.query).toArray();
    res.json(users);
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
});

router.get("/:id", async (req: RequestWithDb, res: Response) => {
  const id = req.params.id;

  try {
    if (!req.db) {
      throw new Error("Database not initialized")
    }

    const user = await req.db
      .collection("users")
      .findOne({ _id: new ObjectId(id) });

    if (user) {
      res.json(user);
    } else {
      res.status(404).send(`Unknown user ID: ${id}`);
    }
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
});

router.post("/", async (req: RequestWithDb, res: Response) => {
  try {
    if (!req.db) {
      throw new Error("Database not initialized")
    }

    const data = pick(req.body, "name", "age", "country");
    const { insertedId } = await req.db.collection("users").insertOne(data);

    res
      .header(
        "Location",
        `${req.protocol}://${req.hostname}/api/users/${insertedId}`
      )
      .sendStatus(201);
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
});

router.patch("/:id", async (req: RequestWithDb, res: Response) => {
  const id = req.params.id;

  try {
    if (!req.db) {
      throw new Error("Database not initialized")
    }

    const data = pick(req.body, "name", "age", "country");
    const { modifiedCount } = await req.db
      .collection("users")
      .updateOne({ _id: new ObjectId(id) }, { $set: data });

    if (modifiedCount === 0) {
      res.status(404).send(`Unknown user ID: ${id}`);
    } else {
      res.sendStatus(204);
    }
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
});

router.delete("/:id", async (req: RequestWithDb, res: Response) => {
  const id = req.params.id;

  try {
    if (!req.db) {
      throw new Error("Database not initialized")
    }

    const { deletedCount } = await req.db.collection("users").deleteOne({ _id: new ObjectId(id) });

    if (deletedCount === 0) {
      res.status(404).send(`Unknown user ID: ${id}`);
    } else {
      res.sendStatus(204);
    }
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
});

