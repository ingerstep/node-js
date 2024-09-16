import { configDotenv } from "dotenv";
import { WebSocketServer } from "ws";

configDotenv();

const wss = new WebSocketServer({ port: process.env.PORT });

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    wss.clients.forEach((ws) => {
      ws.send(message);
    });
  });
});

console.log("Server running");
