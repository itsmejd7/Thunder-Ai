import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { getGeminiReply } from "./utils/APICHAT.js";
import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://thunder-ai-frontend.vercel.app', 'https://thunder-ai-frontend-h8zqa0ph7-jayeshs-projects-0a118279.vercel.app']
    : 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "Thunder-AI Backend is running!" });
});

// Test endpoint
app.get("/test", (req, res) => {
  res.json({ 
    message: "Backend is working!",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
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
