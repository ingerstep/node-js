let client = null;

const loginContainer = document.getElementById("login");
const chatContainer = document.getElementById("chat");
const newMessageContainer = document.getElementById("new-message-container");
const newMessage = document.getElementById("new-message");

const messagesContainer = document.getElementById("chat");

const addMessage = ({ name, message }) => {
  const cEl = document.createElement("p");

  const nEl = document.createElement("span");
  nEl.className = "name";
  nEl.innerText = name;
  cEl.appendChild(nEl);

  const mEl = document.createElement("span");
  mEl.className = "message";
  mEl.innerText = message;
  cEl.appendChild(mEl);

  messagesContainer.appendChild(cEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
};

const postMessage = (message) => {
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(
      JSON.stringify({
        type: "chat_message",
        message,
      })
    );
  }
};

newMessage.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    const value = (newMessage.value || "").trim();

    if (value) {
      postMessage(value);
      newMessage.value = "";
    }
  }
});

loginContainer.addEventListener("submit", (event) => {
  event.preventDefault();

  const username = loginContainer.querySelector(".username").value;
  const password = loginContainer.querySelector(".password").value;

  fetch("/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        return response.text().then((err) => {
          throw new Error(err);
        });
      }
    })
    .then(() => {
      const wsProto = location.protocol === "https:" ? "wss:" : "ws:";
      client = new WebSocket(`${wsProto}//${location.host}`);

      loginContainer.style.display = "none";

      client.addEventListener("open", () => {
        chatContainer.style.display = "block";
        newMessageContainer.style.display = "block";
      });

      client.addEventListener("message", (message) => {
        try {
          const data = JSON.parse(message.data);

          if (data.type === "chat_message") {
            addMessage(data);
          }
        } catch (error) {
          console.error("Failed to parse message:", error);
        }
      });
    })
    .catch((err) => {
      alert(err.message);
    });
});
