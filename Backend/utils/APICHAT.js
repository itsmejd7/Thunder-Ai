import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config(); 

// Provider configuration (trim to avoid accidental whitespace)
const API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : undefined;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.trim() : undefined;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-r1:free";
const OPENROUTER_FALLBACK_MODEL = process.env.OPENROUTER_FALLBACK_MODEL || "meta-llama/llama-3.1-8b-instruct:free";

export async function getGeminiReply(userInput) {
  // If OpenRouter is configured, use it
  if (OPENROUTER_API_KEY) {
    const doRequest = async (model) => {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          ...(process.env.OPENROUTER_REFERER ? { "HTTP-Referer": process.env.OPENROUTER_REFERER } : {}),
          "X-Title": process.env.OPENROUTER_TITLE || "Thunder-AI"
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: String(userInput) }
          ],
          temperature: 0.7
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        const error = new Error(`OpenRouter error ${response.status}: ${errText}`);
        error.status = response.status;
        throw error;
      }
      const data = await response.json();
      return data?.choices?.[0]?.message?.content || "No response";
    };

    const modelsToTry = [OPENROUTER_MODEL, OPENROUTER_FALLBACK_MODEL];
    for (let i = 0; i < modelsToTry.length; i += 1) {
      const model = modelsToTry[i];
      console.log("🤖 Using OpenRouter model:", model);
      let attempt = 0;
      const maxAttempts = 3;
      while (attempt < maxAttempts) {
        try {
          return await doRequest(model);
        } catch (err) {
          // Retry on 429 with exponential backoff
          if (err.status === 429 && attempt < maxAttempts - 1) {
            const delayMs = 500 * Math.pow(2, attempt);
            console.warn(`⚠️ OpenRouter 429. Retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxAttempts})`);
            await new Promise(r => setTimeout(r, delayMs));
            attempt += 1;
            continue;
          }
          console.error("❌ OpenRouter request failed:", err.message);
          // Break to next model if 429 persists or other errors
          break;
        }
      }
    }
    throw new Error("All OpenRouter models failed (rate-limited or unavailable). Please try again later.");
  }

  // Otherwise use Gemini API
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
    const genAI = new GoogleGenerativeAI({ apiKey: API_KEY, apiVersion: 'v1' });
    
    // Use model from environment if provided; default to a broadly supported model
    const configuredModel = process.env.GEMINI_MODEL || "gemini-1.0-flash-lite";
    console.log("🤖 Using model:", configuredModel);
    const model = genAI.getGenerativeModel({ model: configuredModel });
    
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
        const genAI = new GoogleGenerativeAI({ apiKey: API_KEY, apiVersion: 'v1' });
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

// List available models for the configured API key (uses v1 REST)
export async function listAvailableModels() {
  const key = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : undefined;
  if (!key) throw new Error("GEMINI_API_KEY missing");
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${key}`;
  const res = await fetch(url);
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`ListModels failed: ${res.status} ${res.statusText} - ${msg}`);
  }
  return await res.json();
}