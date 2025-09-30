import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { getAIReply } from "./utils/APICHAT.js";
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

app.get("/api/ping", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectdb();
});
