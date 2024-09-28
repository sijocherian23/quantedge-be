import { Server } from "socket.io";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import { readFile, writeFile } from "./helper"; // Import file helper
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const conversationHistoryFile = "./src/data/conversationHistory.json";

// OpenAI API setup (replace with your own API key)
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

export const initializeSocket = (io: Server) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Listen for 'send-message' from client with conversationId
    socket.on("send-message", async (data) => {
      const { user, message, conversationId } = data;
      const userInputData = {
        user_input: message,
      };

      // Load the conversation history from file
      const conversations = readFile(conversationHistoryFile);

      // Find the conversation by conversationId or create a new one
      let conversation = conversations.find(
        (conv: any) => conv.id === conversationId
      );

      if (!conversation) {
        conversation = {
          id: conversationId,
          messages: [],
        };
        conversations.push(conversation);
      }

      // Add user's message to the conversation history
      conversation.messages.push({ role: "user", content: message });

      // Prepare messages for ChatGPT
      const messages: ChatCompletionMessageParam[] = conversation.messages;

      try {
        // Send the chat history to ChatGPT API
        // const response = await openai.chat.completions.create({
        //   model: "gpt-4", // Use the desired GPT model
        //   messages,
        // });
        let botResponse;
        if (process.env.ENABLE_AI == "false") {
          botResponse = {
            message:
              "Strategy Created Successfully. Please find the details below",
            json_obj: {
              strategy_name: "Straddle",
              asset: {
                symbol: "NIFTY",
                type: ["CE", "PE"],
                expiry: {
                  cycle: "weekly",
                  frequency: "monthly",
                },
              },
              entry_trigger: {
                type: "time",
                value: "1045",
              },
              contract_value: {
                type: "between",
                value: [2, 5],
              },
              lot_size: 75,
              risk_management: {
                stop_loss: {
                  type: "percentage",
                  value: 500,
                },
                take_profit: {
                  type: "percentage",
                  value: 100,
                },
              },
              exit_time: "1515",
              actions: {
                entry: "sell",
                exit: "buy",
              },
            },
          };
        } else {
          const response = await axios.post(
            `${process.env.AI_SERVER_URL}/api/options`,
            userInputData
          );

          console.log("Response:", response.data.message);

          botResponse = response.data;
        }

        //Add ChatGPT's response to the conversation history
        conversation.messages.push({
          role: "Bot",
          content: botResponse || "",
        });

        // Save the updated conversation history back to the file
        writeFile(conversationHistoryFile, conversations);

        // Send the response back to the user
        socket.emit("receive-message", {
          user: "Bot",
          message: botResponse,
        });
      } catch (error) {
        const errorMessage = {
          message: "Error processing your request.Please Try again Later",
          json_obj: {
            strategy_name: "Straddle",
            asset: {
              symbol: "NIFTY",
              type: ["CE", "PE"],
              expiry: {
                cycle: "weekly",
                frequency: "monthly",
              },
            },
            entry_trigger: {
              type: "time",
              value: "1045",
            },
            contract_value: {
              type: "between",
              value: [2, 5],
            },
            lot_size: 75,
            risk_management: {
              stop_loss: {
                type: "percentage",
                value: 500,
              },
              take_profit: {
                type: "percentage",
                value: 100,
              },
            },
            exit_time: "1515",
            actions: {
              entry: "sell",
              exit: "buy",
            },
          },
        };
        console.error("Error communicating with AI:", error);
        socket.emit("receive-message", {
          user: "Bot",
          message: errorMessage,
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
