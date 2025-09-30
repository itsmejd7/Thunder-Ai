import dotenv from "dotenv";

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.trim() : undefined;
const GOOGLE_MODEL = process.env.GOOGLE_MODEL || "models/gemini-2.5-flash-lite:generateContent";
const GOOGLE_TIMEOUT_MS = Math.max(5000, Number(process.env.GOOGLE_TIMEOUT_MS || 25000));

export async function getAIReply(userInput) {
  if (!GOOGLE_API_KEY) {
    throw new Error("Missing GOOGLE_API_KEY");
  }
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/${GOOGLE_MODEL}?key=${encodeURIComponent(GOOGLE_API_KEY)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GOOGLE_TIMEOUT_MS);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: String(userInput) }] }
      ]
    }),
    signal: controller.signal
  }).finally(() => clearTimeout(timer));
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Gemini error ${response.status}: ${raw}`);
  }
  let data;
  try { data = JSON.parse(raw); } catch {
    throw new Error(`Gemini parse error: ${raw?.slice(0, 200)}`);
  }
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
  if (typeof text === 'string' && text.trim()) return text;
  throw new Error('Gemini returned empty result');
}