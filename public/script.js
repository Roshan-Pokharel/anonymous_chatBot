const socket = io();
const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const userList = document.getElementById("userList");
const roomTitle = document.getElementById("roomTitle");

// Modal elements
const userModal = document.getElementById("userModal");
const userForm = document.getElementById("userForm");
const nicknameInput = document.getElementById("nicknameInput");

let currentRoom = "public";
let myId = null;
let myGender = "male";

// Show modal and handle form
function showUserModal() {
  userModal.style.display = "flex";
  nicknameInput.focus();

  userForm.onsubmit = function (e) {
    e.preventDefault();
    const nickname = nicknameInput.value.trim();
    const gender = userForm.gender.value;
    if (!nickname) {
      nicknameInput.focus();
      return;
    }
    myGender = gender;
    socket.emit("user info", { nickname, gender });
    userModal.style.display = "none";
    socket.emit("join room", "public");
  };
}

socket.on("connect", () => {
  myId = socket.id;
  showUserModal();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit("chat message", { room: currentRoom, text: input.value });
    input.value = "";
    setTimeout(() => input.focus(), 10); // Keep focus after sending
  }
});

function getGenderSymbol(gender) {
  return gender === "female" ? "♀" : "♂";
}
function getNameColor(gender) {
  return gender === "female" ? "#e75480" : "#3b82f6";
}

socket.on("chat message", (msg) => {
  if (msg.room === currentRoom) {
    const item = document.createElement("div");
    item.classList.add("msg");
    item.innerHTML = `<span style="color:${getNameColor(
      msg.gender
    )};font-weight:600;">
      ${msg.name} ${getGenderSymbol(msg.gender)}:</span> ${msg.text}`;
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
    div.innerHTML = `<span style="color:${getNameColor(
      user.gender
    )};font-weight:600;">
      ${user.name} ${getGenderSymbol(user.gender)}</span>`;
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

// Optional: Focus input on page load
window.onload = () => {
  input.focus();
};
