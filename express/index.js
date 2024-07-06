import e from "express";
import { configDotenv } from "dotenv";
import knex from "knex";
import nunjucks from "nunjucks";
import { nanoid } from "nanoid";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

configDotenv();

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

const app = e();

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

nunjucks.configure("views", {
  autoescape: true,
  express: app,
});

app.set("view engine", "njk");

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

app.get("/", auth(), (req, res) => {
  res.render("index", {
    user: req.user,
    authError: req.query.authError === "true",
  });
});

app.post(
  "/login",
  bodyParser.urlencoded({ extended: false }),
  async (req, res) => {
    const { username, password } = req.body;
    const user = await findUserByUsername(username);

    if (!user || user.password !== password) {
      return res.redirect("/?authError=true");
    }

    const sessionId = await createSession(user.id);

    res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
  }
);

app.post("/api/add-book", auth(), async (req, res) => {
  if (!req.user) {
    return res.sendStatus(401);
  }

  const [books] = await db("users")
    .where({ id: req.user.id })
    .update({ books: db.raw("books + 1") })
    .returning("books");

  res.json({ books });
});

app.get("/logout", auth(), async (req, res) => {
  if (!req.user) {
    return res.redirect("/");
  }

  await deleteSession(req.sessionId);

  res.clearCookie("sessionId").redirect("/");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
