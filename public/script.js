const socket = io();
const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const userList = document.getElementById("userList");
const roomTitle = document.getElementById("roomTitle");
const showUsersBtn = document.getElementById("showUsersBtn");

const userModal = document.getElementById("userModal");
const userForm = document.getElementById("userForm");
const nicknameInput = document.getElementById("nicknameInput");
const ageInput = document.getElementById("ageInput");

const allUsersModal = document.getElementById("allUsersModal");
const allUsersList = document.getElementById("allUsersList");
let latestUsers = [];
let unreadPrivate = {};

let currentRoom = "public";
let myId = null;
let myGender = "male";
let myNickname = "";
let myAge = null;

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
    if (!age || isNaN(age) || age < 18 || age > 99) {
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

socket.on("nickname taken", () => {
  nicknameInput.style.borderColor = "#e11d48";
  nicknameInput.value = "";
  nicknameInput.placeholder = "Nickname already taken!";
  nicknameInput.focus();
});

socket.on("connect", () => {
  myId = socket.id;
  showUserModal();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit("chat message", { room: currentRoom, text: input.value });
    input.value = "";
  }
});

input.addEventListener("focus", () => {
  setTimeout(() => {
    messages.scrollTop = messages.scrollHeight;
  }, 300);
});

function getGenderSymbol(gender) {
  return gender === "female" ? "♀" : "♂";
}
function getNameColor(gender) {
  return gender === "female" ? "#e75480" : "#3b82f6";
}

function addMessage(msg) {
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

socket.on("chat message", (msg) => {
  if (msg.room !== "public" && currentRoom !== msg.room && msg.to === myId) {
    const otherId = msg.id;
    unreadPrivate[otherId] = true;
    updateUserList();
  }
  if (msg.room === currentRoom) {
    addMessage(msg);
    if (msg.room !== "public") {
      const otherId = msg.id === myId ? msg.to : msg.id;
      unreadPrivate[otherId] = false;
      updateUserList();
    }
  }
});

socket.on("room history", (msgs) => {
  messages.innerHTML = "";
  msgs.forEach(addMessage);
  messages.scrollTop = messages.scrollHeight;
});

function updateUserList() {
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

  latestUsers.forEach((user) => {
    if (user.id === myId) return;
    const div = document.createElement("div");
    div.className = "user";
    div.innerHTML =
      `<span style="color:${getNameColor(user.gender)};font-weight:600;">
      ${user.name} ${getGenderSymbol(user.gender)}${
        user.age ? " · " + user.age : ""
      }</span>` +
      (unreadPrivate[user.id] ? '<span class="red-dot"></span>' : "");
    div.onclick = () => {
      currentRoom = [myId, user.id].sort().join("-");
      roomTitle.textContent = `🔒 Chat with ${user.name}`;
      messages.innerHTML = "";
      socket.emit("join room", currentRoom);
      unreadPrivate[user.id] = false;
      updateUserList();
    };
    userList.appendChild(div);
  });
}

socket.on("user list", (users) => {
  latestUsers = users;
  updateUserList();
});

showUsersBtn.onclick = () => {
  if (window.innerWidth <= 768) {
    allUsersList.innerHTML = "";

    const publicBtn = document.createElement("div");
    publicBtn.className = "user";
    publicBtn.style =
      "background:#eef;padding:10px;border-radius:6px;margin-bottom:8px;cursor:pointer;text-align:center;";
    publicBtn.textContent = "🌐 Public Room";
    publicBtn.onclick = () => {
      currentRoom = "public";
      roomTitle.textContent = "🌐 Public Chat";
      messages.innerHTML = "";
      socket.emit("join room", currentRoom);
      allUsersModal.style.display = "none";
    };
    allUsersList.appendChild(publicBtn);

    const countDiv = document.createElement("div");
    countDiv.style =
      "text-align:center;margin-bottom:8px;color:#4f46e5;font-weight:600;";
    countDiv.textContent = `Online Users: ${latestUsers.length}`;
    allUsersList.appendChild(countDiv);

    latestUsers.forEach((user) => {
      if (user.id === myId) return;
      const div = document.createElement("div");
      div.className = "user";
      div.innerHTML =
        `<span style="color:${getNameColor(user.gender)};font-weight:600;">
        ${user.name} ${getGenderSymbol(user.gender)}${
          user.age ? " · " + user.age : ""
        }</span>` +
        (unreadPrivate[user.id] ? '<span class="red-dot"></span>' : "");
      div.onclick = () => {
        currentRoom = [myId, user.id].sort().join("-");
        roomTitle.textContent = `🔒 Chat with ${user.name}`;
        messages.innerHTML = "";
        socket.emit("join room", currentRoom);
        unreadPrivate[user.id] = false;
        updateUserList();
        allUsersModal.style.display = "none";
      };
      allUsersList.appendChild(div);
    });
    allUsersModal.style.display = "flex";
  }
};

allUsersModal.addEventListener("click", (e) => {
  if (e.target === allUsersModal) {
    allUsersModal.style.display = "none";
  }
});

window.onload = () => {
  input.focus();
};
