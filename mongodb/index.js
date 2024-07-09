require("dotenv").config();

const express = require("express")

const app = express()

app.use(express.json())
app.use("/api/users", require("./users"))

app.use((err,req,res,next)=>{
  res.status(500).send(err.message)
})

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
})