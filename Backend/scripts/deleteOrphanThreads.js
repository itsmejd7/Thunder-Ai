import mongoose from "mongoose";
import Thread from "../models/Thread.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/yourdbname";

async function run() {
  await mongoose.connect(MONGODB_URI);
  const result = await Thread.deleteMany({ user: { $exists: false } });
  console.log("Deleted threads without user:", result.deletedCount);
  process.exit(0);
}

run();