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
const ageInput = document.getElementById("ageInput");

let currentRoom = "public";
let myId = null;
let myGender = "male";
let myNickname = "";
let myAge = null;

// Show modal and handle form
function showUserModal() {
  userModal.style.display = "flex";
  nicknameInput.focus();

  userForm.onsubmit = function (e) {
    e.preventDefault();
    const nickname = nicknameInput.value.trim();
    const gender = userForm.gender.value;
    const age = ageInput.value.trim();
    if (!nickname) {
      nicknameInput.focus();
      return;
    }
    if (!age || isNaN(age) || age < 10 || age > 99) {
      ageInput.focus();
      ageInput.style.borderColor = "#e75480";
      return;
    }
    myGender = gender;
    myNickname = nickname;
    myAge = age;
    socket.emit("user info", { nickname, gender, age });
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

// Message bubble rendering
socket.on("chat message", (msg) => {
  if (msg.room === currentRoom) {
    const item = document.createElement("div");
    item.classList.add("msg");
    if (msg.id && msg.id === myId) {
      item.classList.add("me");
    } else {
      item.classList.add("other");
    }
    item.innerHTML = `
      <div class="bubble">
        <span style="color:${getNameColor(msg.gender)};font-weight:600;">
          ${msg.name} ${getGenderSymbol(msg.gender)}${
      msg.age ? " · " + msg.age : ""
    }:</span> ${msg.text}
      </div>
    `;
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
      ${user.name} ${getGenderSymbol(user.gender)}${
      user.age ? " · " + user.age : ""
    }</span>`;
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
