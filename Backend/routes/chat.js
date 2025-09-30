import express from "express";
import rateLimit from "express-rate-limit";
import Thread from "../models/Thread.js";
import { getAIReply } from "../utils/APICHAT.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "changeme-super-secret";

const chatLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

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

router.use(requireAuth);
router.use(chatLimiter);

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

router.get("/thread", async (req, res) => {
  try {
    const threads = await Thread.find({ user: req.user.userId }).sort({ updatedAt: -1 }).lean();
    res.json(threads);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

router.get("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;
  try {
    if (typeof threadId !== 'string' || threadId.length > 200) {
      return res.status(400).json({ error: "Invalid threadId" });
    }
    const thread = await Thread.findOne({ threadId, user: req.user.userId }).lean();
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    res.json(thread.messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chat" });
  }
});

router.delete("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;
  try {
    if (typeof threadId !== 'string' || threadId.length > 200) {
      return res.status(400).json({ error: "Invalid threadId" });
    }
    const deletedThread = await Thread.findOneAndDelete({ threadId, user: req.user.userId });
    if (!deletedThread) return res.status(404).json({ error: "Thread not found" });
    res.status(200).json({ success: "Thread deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete thread" });
  }
});

router.post("/chat", async (req, res) => {
  // Extend response timeout to align with APIFREE timeout + retry buffer
  req.setTimeout?.(30000);
  const { threadId, message } = req.body || {};
  if (!threadId || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    if (typeof message !== 'string' || message.length > 4000) {
      return res.status(400).json({ error: "Invalid message" });
    }
    if (typeof threadId !== 'string' || threadId.length > 200) {
      return res.status(400).json({ error: "Invalid threadId" });
    }
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
    const assistantReply = await getAIReply(message);
    thread.messages.push({ role: "assistant", content: assistantReply });
    thread.updatedAt = new Date();
    await thread.save();
    res.json({ reply: assistantReply });
  } catch (err) {
    console.error("AI provider call failed:", err?.message);
    console.error("Full error object:", err);
    if (err?.response) {
      console.error("Provider response status:", err.response.status);
      console.error("Provider response data:", err.response.data);
    }
    // Always show details for debugging and add header for visibility
    res.setHeader('X-Error-Details', encodeURIComponent(err?.message || ''));
    return res.status(500).json({ 
      error: "Error contacting AI provider", 
      details: err?.message,
      type: err?.constructor?.name,
      code: err?.code
    });
  }
});

export default router;
