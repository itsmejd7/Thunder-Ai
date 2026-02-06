import express from "express";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "changeme-super-secret";
const DEV_MODE = !process.env.MONGODB_URI;

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false });

router.post("/signup", authLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  try {
    if (DEV_MODE) {
      const token = jwt.sign({ userId: `dev_${Buffer.from(email).toString('hex')}`, email }, JWT_SECRET, { expiresIn: "720d" });
      return res.status(201).json({ token, email });
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: "Invalid input." });
    }
    if (email.length > 254 || password.length > 200) {
      return res.status(400).json({ error: "Input too long." });
    }
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return res.status(409).json({ error: "Email already registered." });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email: normalizedEmail, password: hashed });
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, email: user.email });
  } catch (err) {
    res.status(500).json({ error: "Signup failed.", details: err.message });
  }
});

router.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  try {
    if (DEV_MODE) {
      const token = jwt.sign({ userId: `dev_${Buffer.from(email).toString('hex')}`, email }, JWT_SECRET, { expiresIn: "7d" });
      return res.json({ token, email });
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: "Invalid input." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, email: user.email });
  } catch (err) {
    res.status(500).json({ error: "Login failed.", details: err.message });
  }
});

export default router;
