import e from "express";

const app = e();

const COLORS = ["red", "blue", "green"];

const getRandomColor = () => {
  const i = Math.floor(Math.random() * COLORS.length) ;
  return COLORS[i];
};

app.get("/", (req, res) => {
  res.send(`My favourite color is ${getRandomColor()}.`);
});

const port = 3000;
app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
