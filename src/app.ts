// src/server.ts (or .mjs if renamed)
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from 'path'; // Required to access the file system

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(express.json());
app.use(cors());
//app.use("/api/auth", authRoutes);

app.use(express.static(path.join(__dirname, "../public")));


app.get("/chatboat", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});


io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  // Join a specific room (you can customize room assignment logic)
  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
  });

  // Listen for messages from the client
  socket.on("send-message", (data) => {
    console.log("Message received:", data);

    // Emit the message to only the users in the specific room
    io.to(data.room).emit("receive-message", {
      message: data.message,
      user: data.user,
    });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
