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

// Store initial viewport height to detect keyboard
let initialViewportHeight = window.innerHeight;
let isKeyboardOpen = false;

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
    input.focus(); // Keep focus on input for quick replies
  }
});

// A robust scroll to bottom function
function scrollToBottom() {
  if (messages.lastElementChild) {
    // Scroll the last message element into view
    messages.lastElementChild.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  } else {
    // Fallback if no messages yet, scroll the container itself
    requestAnimationFrame(() => {
      messages.scrollTop = messages.scrollHeight;
    });
  }
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
  scrollToBottom(); // Call the robust scroll function
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
  // Ensure final scroll after all history is added
  setTimeout(() => {
    scrollToBottom();
  }, 150); // Small delay to allow rendering
});

// --- KEYBOARD HANDLING LOGIC ---
const adjustChatPadding = () => {
  // Only apply this logic on smaller screens (mobile)
  if (window.innerWidth > 768) {
    messages.style.paddingBottom = ""; // Reset for desktop
    return;
  }

  const currentViewportHeight = window.innerHeight;
  const keyboardHeightEstimate = initialViewportHeight - currentViewportHeight;
  const formHeight = form.offsetHeight; // Get current height of the form

  // A small threshold to account for minor resizes not related to keyboard
  const threshold = 100;

  if (keyboardHeightEstimate > threshold) {
    // Keyboard is likely open
    isKeyboardOpen = true;
    // Set padding-bottom of messages to clear the keyboard + form + a little extra
    messages.style.paddingBottom = `${
      keyboardHeightEstimate + formHeight + 10
    }px`;
    // Also scroll the input into view to ensure it's not hidden
    input.scrollIntoView({ behavior: "smooth", block: "end" });
  } else {
    // Keyboard is likely closed
    isKeyboardOpen = false;
    // Reset padding-bottom. Add the original fixed form height + safe area.
    // We assume the form's height on mobile is roughly 72px (from its padding in CSS) + safe area.
    // This value must match the form's height in CSS when no keyboard is present.
    const defaultFormBottomSpace = formHeight; // Use actual form height
    const safeAreaBottom =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--sa-b",
          "0"
        )
      ) || 0; // Fallback if env() not supported
    messages.style.paddingBottom = `${
      defaultFormBottomSpace + safeAreaBottom + 10
    }px`; // Add a small buffer too
  }
  scrollToBottom(); // Always scroll to bottom after adjustment
};

// Initial setup to capture viewport height and set base padding
window.addEventListener("load", () => {
  initialViewportHeight = window.innerHeight; // Capture initial height
  adjustChatPadding(); // Set initial padding
  scrollToBottom(); // Initial scroll
});

// Listen for input focus (keyboard likely to appear)
input.addEventListener("focus", () => {
  // Use a small timeout to allow keyboard to start appearing
  setTimeout(() => {
    adjustChatPadding();
  }, 100);
});

// Listen for input blur (keyboard likely to disappear)
input.addEventListener("blur", () => {
  // Use a small timeout to allow keyboard to fully disappear
  setTimeout(() => {
    adjustChatPadding();
  }, 100);
});

// Listen for window resize (keyboard appearance/disappearance triggers this)
// Debounce to prevent excessive calls during rapid resizing
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    adjustChatPadding();
  }, 200); // Debounce time
});
// --- END KEYBOARD HANDLING LOGIC ---

function getGenderSymbol(gender) {
  return gender === "female" ? "♀" : "♂";
}
function getNameColor(gender) {
  return gender === "female" ? "#e75480" : "#3b82f6";
}

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
