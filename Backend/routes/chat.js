import express from "express";
import Thread from "../models/Thread.js";
import { getGeminiReply } from "../utils/APICHAT.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "changeme-super-secret";

// Auth middleware
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// All routes below require authentication
router.use(requireAuth);

// POST /chat/test (for testing)
router.post("/test", async (req, res) => {
  try {
    const thread = new Thread({
      threadId: "Jayesh",
      title: "testing new thread new one ",
      user: req.user.userId
    });
    const response = await thread.save();
    res.send(response);
  } catch (err) {
    res.status(500).json({ error: "Failed to save in db" });
  }
});

// GET all threads for the logged-in user
router.get("/thread", async (req, res) => {
  try {
    const threads = await Thread.find({ user: req.user.userId }).sort({ updatedAt: -1 });
    res.json(threads);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

// GET specific thread messages (only if owned by user)
router.get("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;
  try {
    const thread = await Thread.findOne({ threadId, user: req.user.userId });
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    res.json(thread.messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chat" });
  }
});

// DELETE a thread (only if owned by user)
router.delete("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;
  try {
    const deletedThread = await Thread.findOneAndDelete({ threadId, user: req.user.userId });
    if (!deletedThread) return res.status(404).json({ error: "Thread not found" });
    res.status(200).json({ success: "Thread deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete thread" });
  }
});

// POST /chat (create or update thread, only for user)
router.post("/chat", async (req, res) => {
  const { threadId, message } = req.body;
  if (!threadId || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    let thread = await Thread.findOne({ threadId, user: req.user.userId });
    if (!thread) {
      thread = new Thread({
        threadId,
        title: message,
        messages: [{ role: "user", content: message }],
        user: req.user.userId
      });
    } else {
      thread.messages.push({ role: "user", content: message });
    }
    const assistantReply = await getGeminiReply(message);
    thread.messages.push({ role: "assistant", content: assistantReply });
    thread.updatedAt = new Date();
    await thread.save();
    res.json({ reply: assistantReply });
  } catch (err) {
    res.status(500).json({ error: "Error contacting Gemini API" });
  }
});

export default router;
