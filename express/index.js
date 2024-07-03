import e from "express";
import { configDotenv } from "dotenv";
import nunjucks from "nunjucks";
import { nanoid } from "nanoid";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

configDotenv();

const app = e();

const DB = {
  users: [{ _id: nanoid(), username: "admin", password: "qwerty", books: 0 }],
  sessions: {},
};

const findUserByUsername = async (username) =>
  DB.users.find((u) => u.username === username);

const findUserBySessionId = async (sessionId) => {
  const userId = DB.sessions[sessionId];

  if (!userId) {
    return;
  }

  return DB.users.find((u) => u._id === userId);
};

const createSession = async (userId) => {
  const sessionId = nanoid();

  DB.sessions[sessionId] = userId;

  return sessionId;
};

const deleteSession = async (sessionId) => {
  delete DB.sessions[sessionId];
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

    //use hash
    if (!user || user.password !== password) {
      return res.redirect("/?authError=true");
    }

    const sessionId = await createSession(user._id);

    // use signed + secure(https)
    res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
  }
);

app.post("/api/add-book", auth(), async (req, res) => {
  if (!req.user) {
    return res.sendStatus(401);
  }

  const user = await findUserByUsername(req.user.username);
  user.books += 1;
  res.json({ books: user.books });
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
