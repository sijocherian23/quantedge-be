import express from "express";
import fs from "fs";

const router = express.Router();
const conversationHistoryFile = "./src/data/conversationHistory.json";

// Helper function to read and write files
const readFile = (path: string) => JSON.parse(fs.readFileSync(path, "utf8"));

router.get("/:conversationId", (req, res:any) => {
  const histories = readFile(conversationHistoryFile);
  console.log(req.params.conversationId);
  
  const history = histories.find(
    (hist: any) => hist.id === req.params.conversationId
  );
  if (!history) {
    return res.status(404).json({ error: "Conversation history not found" });
  }
  res.json(history);
});

export default router;
