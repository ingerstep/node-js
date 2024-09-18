import { homedir, type } from "os";
import { join } from "path";
import axios from "axios";
import inquirer from "inquirer";
import { configDotenv } from "dotenv";
import fs from "fs";
import { displayTimers } from "./utils/index.js";
import WebSocket from "ws";

configDotenv();

const { SERVER_URL } = process.env;
const sessionFilePath = join(process.cwd(), "session.txt");
let socket;
const saveSessionId = (sessionId) => {
  fs.writeFileSync(sessionFilePath, sessionId);
};

const getSessionId = () => {
  if (fs.existsSync(sessionFilePath)) {
    return fs.readFileSync(sessionFilePath, "utf-8");
  }
  return null;
};

const deleteSessionId = () => {
  if (fs.existsSync(sessionFilePath)) {
    fs.unlinkSync(sessionFilePath);
  }
};

const createWebSocketConnection = () => {
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    socket = new WebSocket(`ws://localhost:3000`);

    socket.onopen = () => {
      console.log("WebSocket connection established");
    };

    socket.onmessage = (event) => {
      const response = JSON.parse(event.data);
      if (response.type === "all_timers") {
        displayTimers(response.timers);
      } else if (response.type === "auth_success") {
        saveSessionId(response.sessionId);
      } else if (response.type === "active_timers") {
        !!response.timers.length && displayTimers(response.timers);
      }
    };

    socket.onerror = (error) => {
      console.log("WebSocket error: ", error);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };
  }
};

const signup = async () => {
  const { username, password } = await inquirer.prompt([
    { name: "username", message: "Username" },
    { name: "password", message: "Password" },
  ]);

  try {
    const response = await axios.post(`http://${SERVER_URL}/signup`, { username, password });

    if (response.data.sessionId) {
      saveSessionId(response.data.sessionId);
      console.log("Signed up successfully!");
    } else {
      console.log(response.data.error);
    }
  } catch (error) {
    console.log(error);
  }
};

const login = async () => {
  const { username, password } = await inquirer.prompt([
    { name: "username", message: "Username" },
    { name: "password", message: "Password" },
  ]);

  createWebSocketConnection();

  socket.onopen = () => {
    socket.send(
      JSON.stringify({
        type: "login",
        username,
        password,
      })
    );
    socket.send(
      JSON.stringify({
        type: "all_timers",
      })
    );
  };
};

const isLoggin = () => {
  const sessionId = getSessionId();
  if (!sessionId) {
    console.log("You need to login first");
    return false;
  }
  return true;
};

const logout = async () => {
  if (!isLoggin()) return;
  const sessionId = getSessionId();
  createWebSocketConnection();

  try {
    await axios.get(`http://${SERVER_URL}/logout`, { headers: { sessionid: sessionId } });
    deleteSessionId();

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
      console.log("Logged out successfully!");
    }
  } catch (error) {
    console.log(error);
  }
};

const startTimer = async (description) => {
  if (!isLoggin()) return;
  const sessionId = getSessionId();
  createWebSocketConnection();

  try {
    const response = await axios.post(
      `http://${SERVER_URL}/api/timers`,
      { description },
      { headers: { sessionid: sessionId } }
    );
    if (response.data) {
      console.log(`Started timer "${description}", ID: ${JSON.stringify(response.data.id["id"])}`);

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "all_timers",
          })
        );
        socket.send(
          JSON.stringify({
            type: "active_timers",
          })
        );
      } else {
        console.log("WebSocket is not connected.");
      }
    } else {
      console.log("Failed to start timer.");
    }
  } catch (error) {
    console.log(error);
  }
};

const stopTimer = async (id) => {
  if (!isLoggin()) return;
  const sessionId = getSessionId();

  try {
    const response = await axios.post(
      `http://${SERVER_URL}/api/timers/${id}/stop`,
      {},
      { headers: { sessionid: sessionId } }
    );

    if (response.data) {
      console.log(`Stopped timer with ID: ${id}`);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "all_timers",
          })
        );
      } else {
        console.log("WebSocket is not connected.");
      }
    } else {
      console.log("Timer not found or already stopped");
    }
  } catch (error) {
    console.log(error);
  }
};

const getStatus = async (id) => {
  if (!isLoggin()) return;
  const sessionId = getSessionId();

  try {
    const url = id ? `http://${SERVER_URL}/api/timers/${id}` : `http://${SERVER_URL}/api/timers`;

    const response = await axios.get(url, { headers: { sessionid: sessionId } });

    const timers = Array.isArray(response.data) ? response.data : [response.data];
    displayTimers(timers);
  } catch (error) {
    console.log(error);
  }
};

const getOldTimers = async () => {
  if (!isLoggin()) return;
  const sessionId = getSessionId();

  try {
    const response = await axios.get(`http://${SERVER_URL}/api/timers`, { headers: { sessionid: sessionId } });

    const timers = response.data.filter((timer) => !timer.is_active);
    displayTimers(timers);
  } catch (error) {
    console.log(error);
  }
};

const main = async () => {
  let exit = false;

  while (!exit) {
    const { command } = await inquirer.prompt([
      {
        name: "command",
        message: "Enter a command (signup, login, logout, start, stop, status, old, exit):\n",
      },
    ]);

    let args = null;
    if (["stop", "status"].includes(command)) {
      const { inputArgs } = await inquirer.prompt([
        {
          name: "inputArgs",
          message: "Enter timer id:\n",
        },
      ]);
      args = inputArgs;
    } else if (["start"].includes(command)) {
      const { inputArgs } = await inquirer.prompt([
        {
          name: "inputArgs",
          message: "Enter timer name:\n",
        },
      ]);
      args = inputArgs;
    }

    switch (command) {
      case "signup":
        await signup();
        break;

      case "login":
        await login();
        break;

      case "logout":
        await logout();
        break;

      case "start":
        await startTimer(args);
        break;

      case "stop":
        await stopTimer(args);
        break;

      case "status":
        await getStatus(args);
        break;

      case "old":
        await getOldTimers();
        break;

      case "exit":
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.close();
          exit = true;
          console.log("Exit successfully!");
        }
        break;

      default:
        console.log("Unknown command");
    }
  }
};

const homeDir = homedir();
const isWindows = type().match(/windows/i);
const sessionFileName = join(homeDir, `${isWindows ? "_" : "."}sb-timers-session`);
console.log("File to keep the session ID:", sessionFileName);

main();
