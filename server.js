const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

let guestCount = 1;
let users = {};

io.on("connection", (socket) => {
  const guestName = "Guest" + guestCount++;
  users[socket.id] = guestName;

  // Send the updated user list
  io.emit(
    "user list",
    Object.keys(users).map((id) => ({ id, name: users[id] }))
  );

  socket.join("public"); // Default room

  // Handle chat messages
  socket.on("chat message", ({ room, text }) => {
    const msg = {
      name: users[socket.id],
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
      Object.keys(users).map((id) => ({ id, name: users[id] }))
    );
  });
});

http.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
