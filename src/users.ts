import express, { Request, Response } from "express";
const { v4: uuidv4 } = require("uuid");
import { readFile, writeFile } from "./helper";

const router = express.Router();
const usersFile = "./src/data/users.json";

// 1. Create User
router.post("/", (req: Request, res: Response) => {
  const users = readFile(usersFile);
  const newUser = { id: uuidv4(), ...req.body };
  users.push(newUser);
  writeFile(usersFile, users);
  res.json(newUser);
});

// 2. Get All Users
router.get("/", (req: Request, res: Response) => {
  const users = readFile(usersFile);
  res.json(users);
});

export default router;
