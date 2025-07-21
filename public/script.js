const socket = io("https://anonymous-chatbot-ifps.onrender.com");
const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const userList = document.getElementById("userList");
const roomTitle = document.getElementById("roomTitle");

let currentRoom = "public";
let myId = null;

socket.on("connect", () => {
  myId = socket.id;
  socket.emit("join room", "public");
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit("chat message", { room: currentRoom, text: input.value });
    input.value = "";
  }
});

socket.on("chat message", (msg) => {
  if (msg.room === currentRoom) {
    const item = document.createElement("div");
    item.classList.add("msg");
    item.innerHTML = `<span>${msg.name}:</span> ${msg.text}`;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
  }
});

socket.on("user list", (users) => {
  userList.innerHTML = "";

  const publicBtn = document.createElement("div");
  publicBtn.className = "user";
  publicBtn.textContent = "🌐 Public Room";
  publicBtn.onclick = () => {
    currentRoom = "public";
    roomTitle.textContent = "🌐 Public Chat";
    messages.innerHTML = "";
    socket.emit("join room", currentRoom);
  };
  userList.appendChild(publicBtn);

  users.forEach((user) => {
    const div = document.createElement("div");
    div.className = "user";
    div.textContent = user.name;
    div.onclick = () => {
      if (user.id !== myId) {
        currentRoom = [myId, user.id].sort().join("-");
        roomTitle.textContent = `🔒 Chat with ${user.name}`;
        messages.innerHTML = "";
        socket.emit("join room", currentRoom);
      }
    };
    userList.appendChild(div);
  });
});
