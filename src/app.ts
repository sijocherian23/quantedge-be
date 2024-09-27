import express from "express";
import { Server } from "socket.io";
import http from "http";
import axios from "axios"; // For calling ChatGPT API
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";

import dotenv from "dotenv";
import { getBacktestResults, login, runBacktest, transformStrategy } from "./backtesting/service";
dotenv.config();

const app = express();
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const PORT = 3000;

// Store chat history in memory (use a database for production)
const chatHistory: {
  [sessionId: string]: ChatCompletionMessageParam[];
} = {};

// OpenAI API setup (replace with your own API key)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Handle new connections
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Listen for 'send-message' from client
  socket.on("send-message", async (data) => {
    const { user, message } = data;
    const sessionId = socket.id;

    // Initialize session if not existing
    if (!chatHistory[sessionId]) {
      chatHistory[sessionId] = [];
    }

    // Add user's message to chat history
    chatHistory[sessionId].push({ role: "user", content: message });

    // Prepare messages for ChatGPT
    const messages: ChatCompletionMessageParam[] = chatHistory[sessionId];

    try {
      console.log(messages);

      // Send the chat history to ChatGPT API
      const response = await openai.chat.completions.create({
        model: "gpt-4", // Use the desired GPT model
        messages,
      });

      const botResponse = response.choices[0].message?.content;

      // Add ChatGPT's response to chat history
      chatHistory[sessionId].push({
        role: "assistant",
        content: botResponse || "",
      });

      // Send the response back to the user
      socket.emit("receive-message", { user: "ChatGPT", message: botResponse });
    } catch (error) {
      console.error("Error communicating with ChatGPT API:", error);
      socket.emit("receive-message", {
        user: "ChatGPT",
        message: "Error processing your request.",
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

app.get("/test", (req, res) => {
  res.send("Hello World!");
});

app.post("/login", async (req, res) => {
  const csrfToken = await login(req.body.token);
  res.send(csrfToken);
});

server.listen(PORT, () => {
  console.log(`Server is running on port localhost:${PORT}`);
});

app.post("/backtest", async (req, res) => {
  const strategy = transformStrategy(req.body)
  const backtestResponse = await runBacktest(strategy)
  const backtestResults = await getBacktestResults(backtestResponse.backtest_id)
  res.send(backtestResults)
})

