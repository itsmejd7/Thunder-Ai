import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { getGeminiReply } from "./utils/APICHAT.js";
import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.set('trust proxy', 1);


const allowedOrigins = [
  'https://thunder-ai-frontend.vercel.app',
  'https://thunder-ai-frontend-h8zqa0ph7-jayeshs-projects-0a118279.vercel.app',
  'https://thunder-ai-amber.vercel.app',
  'https://thunder-ai-jayeshs-projects-0a118279.vercel.app',
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [])
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  optionsSuccessStatus: 204
}));


app.use(express.json());

// Global basic rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS'
});
app.use(apiLimiter);


app.get("/", (req, res) => {
  res.json({ message: "Thunder-AI Backend is running!" });
});

// Test endpoint
app.get("/test", (req, res) => {
  res.json({ 
    message: "Backend is working!",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    model: process.env.GEMINI_MODEL || 'gemini-1.0-pro'
  });
});

// Debug endpoint to check environment
app.get("/debug", (req, res) => {
  res.json({
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    keyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
    keyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + "..." : "NOT_FOUND",
    model: process.env.GEMINI_MODEL || 'gemini-1.0-pro',
    openrouterConfigured: !!process.env.OPENROUTER_API_KEY,
    openrouterModel: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-r1:free',
    exposeErrors: process.env.EXPOSE_ERRORS,
    nodeEnv: process.env.NODE_ENV
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);

const connectdb = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.log("MONGODB_URI not found, skipping database connection");
      return;
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to Database");
  } catch (err) {
    console.error("Database connection error:", err.message);
    console.log("Server will start without database connection");
  }
};

// Start server first, then try to connect to database
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Try to connect to database after server starts
  connectdb();
});
