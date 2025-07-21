// filepath: c:\Users\rosha\anonymous_chatBot\public\script.js
const socket = io();
const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const userList = document.getElementById("userList");
const roomTitle = document.getElementById("roomTitle");
const showUsersBtn = document.getElementById("showUsersBtn");

// Modal elements
const userModal = document.getElementById("userModal");
const userForm = document.getElementById("userForm");
const nicknameInput = document.getElementById("nicknameInput");
const ageInput = document.getElementById("ageInput");

// All users modal (for mobile)
const allUsersModal = document.getElementById("allUsersModal");
const allUsersList = document.getElementById("allUsersList");
let latestUsers = [];

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
    setTimeout(() => input.focus(), 10);
  }
});

// Always scroll messages to bottom on input focus (mobile fix)
input.addEventListener("focus", () => {
  setTimeout(() => {
    messages.scrollTop = messages.scrollHeight;
  }, 100);
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
  latestUsers = users;
  userList.innerHTML = "";

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

// Show online users modal when clicking "Users" button (mobile)
showUsersBtn.onclick = () => {
  if (window.innerWidth <= 768) {
    allUsersList.innerHTML = "";
    const countDiv = document.createElement("div");
    countDiv.style =
      "text-align:center;margin-bottom:8px;color:#4f46e5;font-weight:600;";
    countDiv.textContent = `Online Users: ${latestUsers.length}`;
    allUsersList.appendChild(countDiv);

    latestUsers.forEach((user) => {
      const div = document.createElement("div");
      div.className = "user";
      div.innerHTML = `<span style="color:${getNameColor(
        user.gender
      )};font-weight:600;">
        ${user.name} ${getGenderSymbol(user.gender)}${
        user.age ? " · " + user.age : ""
      }</span>`;
      allUsersList.appendChild(div);
    });
    allUsersModal.style.display = "flex";
  }
};

// Hide all users modal when clicking outside (optional UX)
allUsersModal.addEventListener("click", (e) => {
  if (e.target === allUsersModal) {
    allUsersModal.style.display = "none";
  }
});

window.onload = () => {
  input.focus();
};
