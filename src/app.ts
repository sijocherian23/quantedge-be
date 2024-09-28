import express from "express";
import http from "http";
import { Server } from "socket.io";
import userRoute from "./users";
import conversationRoute from "./conversations";
import historyRoute from "./conversationHistory";
import { initializeSocket } from "./socket";

const fs = require("fs");
const path = require("path");


import dotenv from "dotenv";
import { getBacktestResults, login, runBacktest, transformStrategy } from "./backtesting/service";


dotenv.config();

const app = express();
app.use(express.json());
const server = http.createServer(app);
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
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

app.post("/login", async (req, res) => {
  const csrfToken = await login(process.env.TOKEN as string);
  res.send(csrfToken);
});

server.listen(PORT, () => {
  console.log(`Server is running on port localhost:${PORT}`);
});

app.post("/backtest", async (req, res) => {
  try {
    await login(process.env.TOKEN as string)
    const strategy = transformStrategy(req.body)
    const outputFilePath = path.join(__dirname, "../strategyOutput.json");
    fs.writeFileSync(outputFilePath, JSON.stringify(strategy, null, 2))
    const backtestResponse = await runBacktest(strategy)
    res.send(backtestResponse)
  } catch (err) {
    const errorFilePath = path.join(__dirname, "../src/backtesting/constants/errorResponse.json");
    const jsonData = fs.readFileSync(errorFilePath, 'utf-8');
    const jsonResponse = JSON.parse(jsonData);
    res.send(jsonResponse)
  }
})

app.post("/backtestDetails/:backtestId", async (req, res) => {
  const { backtestId } = req.params;

  try {
    // Fetching backtest details
    const backTestDetails = await getBacktestResults(backtestId);

    // Send the backtest details if successful
    res.status(200).send(backTestDetails);
  } catch (error: any) {
    // Handle errors, log them, and send a proper response to the client
    console.error(`Error in backtestDetails route:`, error.message || "Internal Server Error");

    // Send a 500 status code with an error message
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
      errorDetails:
        error.response?.data ||
        "An error occurred while fetching the backtest data.",
    });
  }
});

