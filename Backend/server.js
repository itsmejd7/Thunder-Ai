import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { getGeminiReply } from "./utils/APICHAT.js";
import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();
const PORT = 5000;
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);

const connectdb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to Database");
  } catch (err) {
    console.error("Database connection error:", err.message);
  }
};

connectdb();

// Optional: direct chat POST route
app.post("/chat", async (req, res) => {
  const userInput = req.body.message;

  if (!userInput) {
    return res.status(400).json({ error: "Message input missing." });
  }

  try {
    const reply = await getGeminiReply(userInput);
    console.log(`AI Response: ${reply}`);
    res.json({ reply });
  } catch (err) {
    console.error(" API Error:", err.message);
    res.status(500).json({ error: "Error contacting Gemini API" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
