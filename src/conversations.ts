import express, { Request, Response } from "express";
import { readFile, writeFile } from "./helper";
const { v4: uuidv4 } = require("uuid");

const router = express.Router();
const conversationsFile = "./src/data/conversations.json";

// 5. Get Conversation by ID


// 3. Create Conversation
router.post("/", (req: Request, res: Response) => {
  const conversations = readFile(conversationsFile);
  const newConversation = {
    id: uuidv4(),
    userId: req.body.userId,
    createdAt: new Date().toISOString(),
  };
  conversations.push(newConversation);
  writeFile(conversationsFile, conversations);
  res.json(newConversation);
});

// 4. Get All User Conversations
router.get(
  "/user/:userId",
  (req: Request<{ userId: string }>, res: Response) => {
    const conversations = readFile(conversationsFile);
    const userConversations = conversations.filter(
      (conv: any) => conv.userId === req.params.userId
    );
    res.json(userConversations);
  }
);

  router.get(
    "/user1/:conversationId",
    (req: Request<{ conversationId: string }>, res: any) => {
      const conversations = readFile(conversationsFile);
      const conversation = conversations.find(
        (conv: any) => conv.id === req.params.conversationId
      );
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    }
  );


export default router;
