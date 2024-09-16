import { configDotenv } from "dotenv";
import { WebSocketServer } from "ws";
import e from "express";
import http from "http";
import { nanoid } from "nanoid";
import { URL } from "url";

configDotenv();

const DB = {
  users: [
    { id: 1, username: "jane", password: "pwd007" },
    { id: 2, username: "joe", password: "pwd008" },
    { id: 3, username: "jack", password: "pwd009" },
  ],
  tokens: {},
};

const app = e();

app.use(e.static("public"));

const server = http.createServer(app);

const wss = new WebSocketServer({ clientTracking: false, noServer: true });
const clients = new Map();

app.post("/login", e.json(), (req, res) => {
  const { username, password } = req.body;
  const user = DB.users.find((u) => u.username === username);

  if (!user) {
    return res.status(401).send("Unknown username");
  }

  if (user.password !== password) {
    return res.status(401).send("Wrong password");
  }

  const token = nanoid();
  DB.tokens[token] = user.id;
  res.json({ token });
});

server.on("upgrade", (req, socket, head) => {
  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const token = searchParams && searchParams.get("token");
  const userId = token && DB.tokens[token];

  if (!userId) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  req.userId = userId;

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

wss.on("connection", (ws, req) => {
  const { userId } = req;

  clients.set(userId, ws);

  ws.on("close", () => {
    clients.delete(userId);
  });

  ws.on("message", (message) => {
    let data;
    
    try {
      data = JSON.parse(message);
    } catch (error) {
      return;
    }

    if (data.type === "chat_message") {
      const user = DB.users.find((u) => u.id === userId);
      const fullMessage = JSON.stringify({
        type: "chat_message",
        message: data.message,
        name: user.username,
      });

      for (ws of clients.values()) {
        ws.send(fullMessage)
      }
    }
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});
