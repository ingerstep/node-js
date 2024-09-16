import { configDotenv } from "dotenv";
import { WebSocketServer } from "ws";
import e from "express";
import http from "http";

configDotenv();

const app = e();

app.use(e.static("public"));

const server = http.createServer(app);

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    wss.clients.forEach((ws) => {
      ws.send(message);
    });
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});
