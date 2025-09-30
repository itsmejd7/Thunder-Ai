import dotenv from "dotenv";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.trim() : undefined;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-r1:free";
const OPENROUTER_FALLBACK_MODEL = process.env.OPENROUTER_FALLBACK_MODEL || "meta-llama/llama-3.1-8b-instruct:free";
const APIFREE_URL = process.env.APIFREE_URL ? process.env.APIFREE_URL.trim() : undefined;
const APIFREE_TIMEOUT_MS = Number(process.env.APIFREE_TIMEOUT_MS || 20000);
const APIFREE_RETRIES = Math.max(0, Number(process.env.APIFREE_RETRIES || 0));
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN.trim() : undefined;
const GITHUB_MODELS_ENDPOINT = process.env.GITHUB_MODELS_ENDPOINT || "https://models.github.ai/inference";
const GITHUB_MODEL = process.env.GITHUB_MODEL || "deepseek/DeepSeek-V3-0324";

export async function getAIReply(userInput) {
  if (GITHUB_TOKEN) {
    try {
      const client = ModelClient(GITHUB_MODELS_ENDPOINT, new AzureKeyCredential(GITHUB_TOKEN));
      const response = await client.path("/chat/completions").post({
        body: {
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: String(userInput) }
          ],
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2048,
          model: GITHUB_MODEL
        }
      });
      if (isUnexpected(response)) {
        const err = new Error(response.body?.error?.message || "GitHub Models request failed");
        err.code = response.body?.error?.code;
        throw err;
      }
      const content = response.body?.choices?.[0]?.message?.content || response.body?.choices?.[0]?.text || "";
      if (typeof content === "string" && content.trim().length > 0) return content;
      return "No response";
    } catch {}
  }

  if (APIFREE_URL && !OPENROUTER_API_KEY) {
    let attempt = 0;
    while (attempt <= APIFREE_RETRIES) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), APIFREE_TIMEOUT_MS);
      try {
        const response = await fetch(APIFREE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: String(userInput) }),
          signal: controller.signal
        });
        if (!response.ok) {
          const text = await response.text().catch(() => "");
          const err = new Error(`APIFREE error ${response.status}: ${text}`);
          err.status = response.status;
          if ((err.status === 502 || err.status === 503) && attempt < APIFREE_RETRIES) {
            attempt += 1;
            await new Promise(r => setTimeout(r, 800));
            continue;
          }
          throw err;
        }
        const textBody = await response.text();
        let data;
        try { data = JSON.parse(textBody); } catch {}
        const possible = data?.reply || data?.message || data?.content || data?.response || data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || textBody;
        const resultText = typeof possible === 'string' ? possible : JSON.stringify(possible);
        return resultText && resultText.trim().length > 0 ? resultText : "No response";
      } catch (err) {
        if (err?.name === 'AbortError') {
          if (attempt < APIFREE_RETRIES) {
            attempt += 1;
            await new Promise(r => setTimeout(r, 500));
            continue;
          }
          const timeoutErr = new Error(`APIFREE timeout after ${APIFREE_TIMEOUT_MS}ms`);
          timeoutErr.code = 'ETIMEDOUT';
          throw timeoutErr;
        }
        if ((err?.status === 502 || err?.status === 503 || err?.code === 'ECONNRESET') && attempt < APIFREE_RETRIES) {
          attempt += 1;
          await new Promise(r => setTimeout(r, 800));
          continue;
        }
        throw err;
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  if (OPENROUTER_API_KEY) {
    let lastOpenRouterError;
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
      let attempt = 0;
      const maxAttempts = 3;
      while (attempt < maxAttempts) {
        try {
          return await doRequest(model);
        } catch (err) {
          if (err.status === 429 && attempt < maxAttempts - 1) {
            const delayMs = 500 * Math.pow(2, attempt);
            await new Promise(r => setTimeout(r, delayMs));
            attempt += 1;
            continue;
          }
          lastOpenRouterError = err;
          break;
        }
      }
    }
    const failureMessage = "All OpenRouter models failed (rate-limited or unavailable). Please try again later.";
    if (APIFREE_URL) {
      let attempt = 0;
      while (attempt <= APIFREE_RETRIES) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), APIFREE_TIMEOUT_MS);
        try {
          const response = await fetch(APIFREE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: String(userInput) }),
            signal: controller.signal
          });
          if (!response.ok) {
            const text = await response.text().catch(() => "");
            const err = new Error(`APIFREE error ${response.status}: ${text}`);
            err.status = response.status;
            if ((err.status === 502 || err.status === 503) && attempt < APIFREE_RETRIES) {
              attempt += 1;
              await new Promise(r => setTimeout(r, 800));
              continue;
            }
            throw err;
          }
          const textBody = await response.text();
          let data;
          try { data = JSON.parse(textBody); } catch {}
          const possible = data?.reply || data?.message || data?.content || data?.response || data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || textBody;
          const resultText = typeof possible === 'string' ? possible : JSON.stringify(possible);
          return resultText && resultText.trim().length > 0 ? resultText : "No response";
        } catch (err) {
          if (err?.name === 'AbortError') {
            if (attempt < APIFREE_RETRIES) {
              attempt += 1;
              await new Promise(r => setTimeout(r, 500));
              continue;
            }
            const timeoutErr = new Error(`APIFREE timeout after ${APIFREE_TIMEOUT_MS}ms`);
            timeoutErr.code = 'ETIMEDOUT';
            throw timeoutErr;
          }
          if ((err?.status === 502 || err?.status === 503 || err?.code === 'ECONNRESET') && attempt < APIFREE_RETRIES) {
            attempt += 1;
            await new Promise(r => setTimeout(r, 800));
            continue;
          }
          break;
        } finally {
          clearTimeout(timeout);
        }
      }
    }
    const error = new Error(failureMessage);
    error.code = undefined;
    throw error;
  }

  if (APIFREE_URL) {
    let attempt = 0;
    while (attempt <= APIFREE_RETRIES) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), APIFREE_TIMEOUT_MS);
      try {
        const response = await fetch(APIFREE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: String(userInput) }),
          signal: controller.signal
        });
        if (!response.ok) {
          const text = await response.text().catch(() => "");
          const err = new Error(`APIFREE error ${response.status}: ${text}`);
          err.status = response.status;
          throw err;
        }
        const textBody = await response.text();
        let data;
        try { data = JSON.parse(textBody); } catch {}
        const possible = data?.reply || data?.message || data?.content || data?.response || data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || textBody;
        const resultText = typeof possible === 'string' ? possible : JSON.stringify(possible);
        return resultText && resultText.trim().length > 0 ? resultText : "No response";
      } catch (err) {
        if (err?.name === 'AbortError') {
          if (attempt < APIFREE_RETRIES) {
            attempt += 1;
            await new Promise(r => setTimeout(r, 500));
            continue;
          }
          const timeoutErr = new Error(`APIFREE timeout after ${APIFREE_TIMEOUT_MS}ms`);
          timeoutErr.code = 'ETIMEDOUT';
          throw timeoutErr;
        }
        throw err;
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  throw new Error("No AI provider configured. Set GITHUB_TOKEN, OPENROUTER_API_KEY, or APIFREE_URL.");
}