import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config(); 

// Gemini API configuration
const API_KEY = process.env.GEMINI_API_KEY;

export async function getGeminiReply(userInput) {
  // Step 1: Check API key
  console.log("🔑 Checking API key...");
  console.log("🔑 API Key present:", Boolean(API_KEY));
  
  if (!API_KEY) {
    console.error("❌ No Gemini API key found in environment variables");
    throw new Error("No Gemini API key found. Please add GEMINI_API_KEY to your .env file");
  }

  // Basic format check without logging key contents
  if (!API_KEY.startsWith('AIza') || API_KEY.length < 35) {
    console.error("❌ API key format looks invalid. Should start with 'AIza' and be ~39 characters");
    throw new Error("Invalid API key format. Please check your GEMINI_API_KEY");
  }

  try {
    console.log("🤖 Initializing Google AI...");
    
    // Initialize the Google AI SDK
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // Use gemini-1.5-pro model first; more universally available in some regions
    console.log("🤖 Using gemini-1.5-pro-latest model...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    
    console.log("🤖 Sending request to Gemini API...");
    
    // Generate content
    const result = await model.generateContent(userInput);
    const response = await result.response;
    
    // Handle structured response properly
    let text = "";
    try {
      // Try to get text from response parts
      if (response.candidates && response.candidates[0] && response.candidates[0].content) {
        const content = response.candidates[0].content;
        if (content.parts && content.parts.length > 0) {
          text = content.parts.map(part => part.text || "").join("");
        } else {
          text = content.text || "";
        }
      } else {
        // Fallback to direct text method
        text = await response.text();
      }
    } catch (textError) {
      console.log("⚠️ Error getting text, trying alternative method");
      text = await response.text();
    }
    
    // Debug: Log the type and content
    console.log("🔍 Response type:", typeof text);
    console.log("🔍 Response content preview:", text ? text.substring(0, 200) : "null/undefined");
    
    // Ensure text is always a string
    if (!text || typeof text !== 'string') {
      console.log("⚠️ Converting non-string response to string");
      if (text === null || text === undefined) {
        text = "No response received from AI";
      } else if (typeof text === 'object') {
        text = JSON.stringify(text, null, 2);
      } else {
        text = String(text);
      }
    }
    
    console.log("✅ Gemini API response received");
    console.log("📝 Gemini reply length:", text.length, "characters");
    
    return text;

  } catch (err) {
    console.error("❌ Gemini API request failed:", err.message);
    if (err?.response) {
      console.error("❌ Gemini status:", err.response.status);
      console.error("❌ Gemini data:", err.response.data);
    }
    // Create a clearer error message
    const status = err?.response?.status;
    let reason = err?.message || "Unknown Gemini error";
    if (status === 401 || /API key not valid|unauthorized/i.test(reason)) {
      reason = "Gemini auth failed (401). Check GEMINI_API_KEY and project permissions/billing.";
    } else if (status === 403 || /permission|forbidden/i.test(reason)) {
      reason = "Gemini permission denied (403). Enable API access/billing for your key.";
    } else if (status === 404 || /not found|model|unsupported/i.test(reason)) {
      reason = "Gemini model not found/unsupported (404). Try a supported model for your key.";
    } else if (status === 429 || /quota|rate|exceed/i.test(reason)) {
      reason = "Gemini quota exceeded (429). Reduce requests or increase quota/billing.";
    } else if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network/i.test(reason)) {
      reason = "Network error reaching Gemini. Check server egress and DNS.";
    }
    
    // If gemini-1.5-pro fails, try gemini-1.5-flash
    if (err.message.includes("not found") || err.message.includes("404") || err.message.includes("not supported")) {
      console.error("❌ Model not found. Trying gemini-1.5-flash-latest...");
      try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent(userInput);
        const response = await result.response;
        
        // Handle structured response properly
        let text = "";
        try {
          // Try to get text from response parts
          if (response.candidates && response.candidates[0] && response.candidates[0].content) {
            const content = response.candidates[0].content;
            if (content.parts && content.parts.length > 0) {
              text = content.parts.map(part => part.text || "").join("");
            } else {
              text = content.text || "";
            }
          } else {
            // Fallback to direct text method
            text = await response.text();
          }
        } catch (textError) {
          console.log("⚠️ Error getting text, trying alternative method");
          text = await response.text();
        }
        
        // Debug: Log the type and content
        console.log("🔍 Fallback response type:", typeof text);
        console.log("🔍 Fallback response content preview:", text ? text.substring(0, 200) : "null/undefined");
        
        // Ensure text is always a string
        if (!text || typeof text !== 'string') {
          console.log("⚠️ Converting non-string fallback response to string");
          if (text === null || text === undefined) {
            text = "No response received from AI";
          } else if (typeof text === 'object') {
            text = JSON.stringify(text, null, 2);
          } else {
            text = String(text);
          }
        }
        
        console.log("✅ Gemini API response received with gemini-1.5-flash");
        return text;
      } catch (proErr) {
        console.error("❌ gemini-1.5-flash also failed:", proErr.message);
        // Re-throw with mapped reason for upstream handler
        const wrapped = new Error(reason);
        wrapped.code = proErr?.code;
        wrapped.cause = proErr;
        throw wrapped;
      }
    } else if (err.message.includes("API key not valid")) {
      console.error("❌ Your API key is being rejected. Please check GEMINI_API_KEY and billing.");
    }
    // Throw mapped reason
    const wrapped = new Error(reason);
    wrapped.code = err?.code;
    wrapped.cause = err;
    throw wrapped;
  }
} 
