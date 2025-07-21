const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

let users = {};

io.on("connection", (socket) => {
  // Wait for user info from client
  socket.on("user info", ({ nickname, gender, age }) => {
    users[socket.id] = {
      name: nickname || "Guest",
      gender: gender || "male",
      age: age || "",
    };
    // Send updated user list
    io.emit(
      "user list",
      Object.keys(users).map((id) => ({
        id,
        name: users[id].name,
        gender: users[id].gender,
        age: users[id].age,
      }))
    );
  });

  socket.join("public"); // Default room

  // Handle chat messages
  socket.on("chat message", ({ room, text }) => {
    const user = users[socket.id] || { name: "Guest", gender: "male", age: "" };
    const msg = {
      id: socket.id,
      name: user.name,
      gender: user.gender,
      age: user.age,
      text,
      room,
    };
    io.to(room).emit("chat message", msg);
  });

  // Join a specific room
  socket.on("join room", (roomId) => {
    socket.join(roomId);
  });

  // Disconnect
  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit(
      "user list",
      Object.keys(users).map((id) => ({
        id,
        name: users[id]?.name,
        gender: users[id]?.gender,
        age: users[id]?.age,
      }))
    );
  });
});

http.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
