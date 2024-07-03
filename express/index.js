import express from "express";
import nunjucks from "nunjucks";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import csurf from "csurf";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

nunjucks.configure("views", {
  autoescape: true,
  express: app,
});

app.set("view engine", "njk");

app.use(morgan("combined"));
app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());
app.use(compression());
app.use(cors());
app.use(csurf({ cookie: true }));
app.use(helmet());

let count = 0;

app.post("/inc", (req, res) => {
  const data = req.body;
  count += data.value || 1;
  res.json({ count });
});

const uiKitCss =
  '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/uikit@3.21.6/dist/css/uikit.min.css" />';

app.get("/", (req, res) => {
  const counts = [];

  for (let i = 0; i < count; i++) {
    counts.push(99 - i);
  }

  res.render("index", { count, uiKitCss, counts });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
