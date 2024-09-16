import chalk from "chalk";
import { faker } from "@faker-js/faker";
import WebSocket from "ws";
import { configDotenv } from "dotenv";

configDotenv();

const client = new WebSocket(`ws://localhost:${process.env.PORT}`);

const name = faker.internet.userName();

client.on("message", (data) => {
  try {
    data = JSON.parse(data);
  } catch (error) {
    return;
  }

  if (data.type === "chat_message") {
    console.log(`${chalk.bold.green(data.name)}: ${chalk.blue(data.message)}`);
  }
});

const postMessage = () => {
  const message = faker.lorem.sentence();

  client.send(
    JSON.stringify({
      type: "chat_message",
      name,
      message,
    })
  );

  setTimeout(postMessage, 2000 + (Math.random() - 0.5) * 200);
};

client.on("open", postMessage)
