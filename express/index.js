import express from "express";
import nunjucks from "nunjucks";
import { promises as fs } from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const uploadsDir = path.join(__dirname, "public", "uploads");

nunjucks.configure("views", {
  autoescape: true,
  express: app,
});

app.set("view engine", "njk");

app.use(express.static("public"));

const fileFilter = (req, file, cb) => {
  cb(null, file.mimetype.match(/^image\//));
};

const upload = multer({
  dest: uploadsDir,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

app.get("/", async (req, res) => {
  const files = (await fs.readdir(uploadsDir)).sort().reverse();
  res.render("index", { files });
});

app.post("/upload", upload.single("image"), (req, res) => {
  res.redirect("/");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
