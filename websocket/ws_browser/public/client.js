/* global faker */
const wsProto = location.protocol === "https:" ? "wss:" : "ws:";
const client = new WebSocket(`${wsProto}//${location.host}`);

const name = faker.internet.userName();

const messagesContainer = document.getElementById("chat");

const addMessage = ({ name, message }) => {
  const cEl = document.createElement("p");

  const nEl = document.createElement("span");
  nEl.innerText = name;
  cEl.appendChild(nEl);

  const mEl = document.createElement("span");
  mEl.innerText = message;
  cEl.appendChild(mEl);

  messagesContainer.appendChild(cEl);
  messagesContainer.scrollTo = messagesContainer.scrollHeight;
};

client.addEventListener("message", async (message) => {
  let data;

  try {
    const text = await message.data.text();
    data = JSON.parse(text);
  } catch (error) {
    return;
  }

  if (data.type === "chat_message") {
    addMessage(data)
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

client.addEventListener("open", postMessage);
