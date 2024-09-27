import express from "express";
import http from "http";
import { Server } from "socket.io";
import userRoute from "./users";
import conversationRoute from "./conversations";
import historyRoute from "./conversationHistory";
import { initializeSocket } from "./socket";


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const PORT = 3000;

// Middleware for parsing JSON
app.use(express.json());

// Initialize WebSocket
initializeSocket(io);

// Define API routes
app.use("/api/users", userRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/conversation-history", historyRoute);

// Test route
app.get("/test", (req, res) => {
  res.send("Hello World!");
});



// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port localhost:${PORT}`);
});
