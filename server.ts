/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Backup system-provided key BEFORE dotenv loads any custom .env overrides
const SYSTEM_API_KEY = process.env.GEMINI_API_KEY;

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase request size to support file attachments base64 uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Server API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Real Gemini Chat Proxy
app.post("/api/chat", async (req, res): Promise<any> => {
  try {
    const { message, history = [], thinking, webSearch, files = [] } = req.body;

    let apiKey = process.env.GEMINI_API_KEY || SYSTEM_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      apiKey = SYSTEM_API_KEY || "";
    }
    if (!apiKey) {
      return res.status(500).json({ error: "No Gemini API key configured. Set GEMINI_API_KEY in your .env file." });
    }

    // Optimize TPM/tokens limit consumption by keeping only the last 15 messages of conversation
    const maxHistoryCount = 15;
    const recentHistory = history.slice(-maxHistoryCount);

    // Map history to Google GenAI schema
    const mappedHistory = recentHistory.map((chat: any) => {
      const parts: any[] = [];
      
      // If previous message had files attached, we can include them
      if (chat.files && chat.files.length > 0) {
        for (const file of chat.files) {
          if (file.base64) {
            // strip mime type header if present in base64 string
            const base64Data = file.base64.split(",")[1] || file.base64;
            parts.push({
              inlineData: {
                data: base64Data,
                mimeType: file.type,
              },
            });
          }
        }
      }

      parts.push({ text: chat.text });

      return {
        role: chat.sender === "user" ? "user" : "model",
        parts,
      };
    });

    // Handle current user input message parts (with file attachments)
    const currentParts: any[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.base64) {
          const base64Data = file.base64.split(",")[1] || file.base64;
          currentParts.push({
            inlineData: {
              data: base64Data,
              mimeType: file.type,
            },
          });
        }
      }
    }
    currentParts.push({ text: message });

    // Combine history and current message
    const contents = [
      ...mappedHistory,
      {
        role: "user",
        parts: currentParts,
      },
    ];

    // Configure system instructions and tools
    let systemInstruction = 
      "You are Gnim AI, a deep, thoughtful Private AI assistant built for productivity, creativity, and clarity. " +
      "Always respond in clear, elegant Markdown with structured headers, bullet points, checklists, and code formatting where appropriate.";

    if (thinking) {
      systemInstruction += 
        "\n\nCRITICAL CONTEXT: Thinking Mode is ACTIVE. Before you begin answering, you MUST perform deep reasoning. " +
        "Output your entire step-by-step thinking process inside a `<thinking>` tag (e.g. `<thinking>My logical steps and self-correction...</thinking>`) " +
        "as the absolute FIRST part of your response. Then write your refined, markdown-styled final answer immediately after the closing tag.";
    } else {
      systemInstruction += "\n\nThinking Mode is INACTIVE. Answer the user prompt directly and do not output any `<thinking>` tags.";
    }

    const config: any = {
      systemInstruction,
    };

    // Support search grounding
    if (webSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    // Helper wrapper to try content generation with specified credential and model
    const generateWithParams = async (keyToUse: string, modelToUse: string) => {
      const client = new GoogleGenAI({
        apiKey: keyToUse,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      return await client.models.generateContent({
        model: modelToUse,
        contents,
        config,
      });
    };

    let response: any;
    let fallbackStatus = "";

    try {
      // Step 1: Run standard query with the primary key and the default high quality model
      response = await generateWithParams(apiKey, "gemini-2.5-flash");
    } catch (primaryError: any) {
      console.warn("Primary model query failed:", primaryError.message || primaryError);

      // Step 2: Try falling back using the platform's standard higher-quota default key
      if (SYSTEM_API_KEY && SYSTEM_API_KEY !== apiKey) {
        try {
          console.log("Attempting fallback with platform standard SYSTEM_API_KEY with gemini-2.5-flash...");
          response = await generateWithParams(SYSTEM_API_KEY, "gemini-2.5-flash");
          apiKey = SYSTEM_API_KEY;
          fallbackStatus = "Self-Healed: Recovered with System developer credential.";
        } catch (systemKeyError) {
          console.warn("Fallback to system key also hit quota/error limits:", systemKeyError);
        }
      }

      // Step 3: Try falling back to gemini-3.1-flash-lite on the custom key if still failed
      if (!response) {
        try {
          console.log("Attempting fallback to light architecture model: gemini-2.0-flash-lite...");
          response = await generateWithParams(apiKey, "gemini-2.0-flash-lite");
          fallbackStatus = "Self-Healed: Recovered with gemini-2.0-flash-lite.";
        } catch (liteError) {
          console.warn("Light architecture query failed:", liteError);
          
          // Step 4: Try falling back to gemini-3.1-flash-lite with the platform standard key
          if (SYSTEM_API_KEY && SYSTEM_API_KEY !== apiKey) {
            try {
              console.log("Attempting fallback using platform standard key with gemini-2.0-flash-lite...");
              response = await generateWithParams(SYSTEM_API_KEY, "gemini-2.0-flash-lite");
              apiKey = SYSTEM_API_KEY;
              fallbackStatus = "Self-Healed: Recovered with System developer credential and gemini-2.0-flash-lite.";
            } catch (liteSystemError) {
              console.warn("Final fallback stage exhausted:", liteSystemError);
            }
          }
        }
      }

      // If all fallbacks failed, propagate the error upwards
      if (!response) {
        throw primaryError;
      }
    }

    const replyText = response.text || "";
    
    // Extract search grounding metadata if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks.map((chunk: any) => ({
      title: chunk.web?.title || chunk.web?.uri || "Web Source",
      uri: chunk.web?.uri || "",
    })).filter((s: any) => s.uri !== "");

    if (fallbackStatus) {
      console.log(`Fallback recovery status: ${fallbackStatus}`);
    }

    return res.json({
      text: replyText,
      sources,
    });

  } catch (error: any) {
    console.error("Gemini proxy error:", error);

    const isQuotaError = 
      error.status === 429 ||
      error.message?.includes("429") || 
      error.message?.includes("Quota") ||
      error.message?.includes("quota") ||
      error.message?.includes("exhausted") ||
      error.message?.includes("EXHAUSTED");

    if (isQuotaError) {
      // Instead of failing the entire response container, return a beautiful instructions bubble
      return res.status(200).json({
        text: `⚠️ **API Quota Exhausted (Rate Limit / Credit Exhaustion)**

The provided API key (configured custom secret or platform credential) has exceeded its current Google AI Studio free tier quota.

### How to resolve this right now:
1. **Remove any custom API key overrides (Recommended)**:
   - Clear any custom keys in your application's settings or dotenv configuration file.
   - Let the application fall back to the platform's default built-in AI Studio developer project credentials, which have higher quota limits.
2. **Upgrade context limits**:
   - Check your key status or upgrade your developer plan at the Google AI Studio Console (https://aistudio.google.com).
3. **Wait a few minutes**:
   - Standard free API keys reset periodically. Try sending your message again in 1–2 minutes.

*Technical Detail: ${error.message || "RESOURCE_EXHAUSTED"}*`,
        sources: []
      });
    }

    return res.status(500).json({
      error: error.message || "An unexpected error occurred while communicating with Gnim AI."
    });
  }
});

// Setup Vite Dev server or production static serving
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted in development mode.");
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static files from /dist in production mode.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Gnim AI Server running at http://localhost:${PORT}`);
  });
}

initServer().catch((err) => {
  console.error("Failed to initialize Express server:", err);
});
