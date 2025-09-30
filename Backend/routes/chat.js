import express from "express";
import rateLimit from "express-rate-limit";
import Thread from "../models/Thread.js";
import { getAIReply } from "../utils/APICHAT.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "changeme-super-secret";
const DEV_MODE = !process.env.MONGODB_URI;
const CHAT_TIMEOUT_MS = Math.max(3000, Number(process.env.CHAT_TIMEOUT_MS || 12000));

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

if (!DEV_MODE) {
  router.use(requireAuth);
}
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
  req.setTimeout?.(CHAT_TIMEOUT_MS + 2000);
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
    const userId = DEV_MODE ? (req.user?.userId || 'dev_user') : req.user.userId;
    let thread = await Thread.findOne({ threadId, user: userId });
    if (!thread) {
      thread = new Thread({
        threadId,
        title: message,
        messages: [{ role: "user", content: message }],
        user: userId
      });
    } else {
      thread.messages.push({ role: "user", content: message });
    }
    const assistantReply = await Promise.race([
      getAIReply(message),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`CHAT_TIMEOUT after ${CHAT_TIMEOUT_MS}ms`)), CHAT_TIMEOUT_MS))
    ]);
    thread.messages.push({ role: "assistant", content: assistantReply });
    thread.updatedAt = new Date();
    if (!DEV_MODE) {
      await thread.save();
    }
    res.json({ reply: assistantReply });
  } catch (err) {
    // Graceful fallback for local/dev or provider failure
    const fallback = `Hello! I'm Thunder-AI. You said: "${String(message)}". This is a simulated response while the AI provider is unavailable.`;
    try {
      const userId = DEV_MODE ? (req.user?.userId || 'dev_user') : req.user?.userId;
      let thread = await Thread.findOne({ threadId, user: userId });
      if (!thread) {
        thread = new Thread({ threadId, title: message, messages: [], user: userId });
      }
      thread.messages.push({ role: 'assistant', content: fallback });
      thread.updatedAt = new Date();
      if (!DEV_MODE) {
        await thread.save();
      }
    } catch {}
    return res.json({ reply: fallback });
  }
});

export default router;
