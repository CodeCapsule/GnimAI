/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { generateText, gateway, generateImage, experimental_generateVideo as generateVideo } from "ai";
import dotenv from "dotenv";

// Load .env.local first (Vercel OIDC token), then fall back to .env
dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const PORT = 3000;

// `gateway` from 'ai' is the pre-built Vercel AI Gateway provider.
// On Vercel deployments: uses OIDC token automatically (no API key needed).
// Locally: uses AI_GATEWAY_API_KEY from .env.local or .env.

// Increase request size to support file attachments base64 uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ---------------------------------------------------------------------------
// Helper: map our chat history to AI SDK messages format
// ---------------------------------------------------------------------------
function buildMessages(history: any[], currentMessage: string, files: any[]) {
  const maxHistoryCount = 15;
  const recentHistory = history.slice(-maxHistoryCount);

  const messages: any[] = recentHistory.map((chat: any) => {
    const contentParts: any[] = [];

    // Include image attachments from history
    if (chat.files && chat.files.length > 0) {
      for (const file of chat.files) {
        if (file.base64 && file.type?.startsWith("image/")) {
          const base64Data = file.base64.includes(",")
            ? file.base64.split(",")[1]
            : file.base64;
          contentParts.push({
            type: "image",
            image: base64Data,
            mimeType: file.type,
          });
        }
      }
    }

    contentParts.push({ type: "text", text: chat.text || "" });

    return {
      role: chat.sender === "user" ? "user" : "assistant",
      content: contentParts.length === 1 ? chat.text || "" : contentParts,
    };
  });

  // Build current user message (with optional file attachments)
  const currentParts: any[] = [];
  if (files && files.length > 0) {
    for (const file of files) {
      if (file.base64 && file.type?.startsWith("image/")) {
        const base64Data = file.base64.includes(",")
          ? file.base64.split(",")[1]
          : file.base64;
        currentParts.push({
          type: "image",
          image: base64Data,
          mimeType: file.type,
        });
      }
    }
  }
  currentParts.push({ type: "text", text: currentMessage });

  messages.push({
    role: "user",
    content: currentParts.length === 1 ? currentMessage : currentParts,
  });

  return messages;
}

// ---------------------------------------------------------------------------
// Helper: model fallback chain for all AI SDK text tasks
// ---------------------------------------------------------------------------
function getModelFallbackChain(model?: string) {
  const chain: string[] = [];
  if (model) chain.push(model);

  const defaults = [
    "google/gemini-2.5-flash",
    "google/gemini-2.0-flash",
    "google/gemini-2.0-flash-lite",
  ];

  for (const fallback of defaults) {
    if (!chain.includes(fallback)) chain.push(fallback);
  }

  return chain;
}

async function runGatewayTextGeneration({
  model,
  system,
  messages,
  prompt,
  maxOutputTokens = 8192,
}: {
  model?: string;
  system: string;
  messages?: any[];
  prompt?: string;
  maxOutputTokens?: number;
}) {
  let lastError: any = null;

  for (const modelToTry of getModelFallbackChain(model)) {
    try {
      console.log(`[Gateway] Trying model: ${modelToTry}`);
      const result = await generateText({
        model: gateway(modelToTry) as any,
        system,
        messages,
        prompt,
        maxOutputTokens,
      } as any);

      console.log(`[Gateway] Response served via: ${modelToTry}`);
      return {
        text: result.text ?? "",
        usedModel: modelToTry,
      };
    } catch (err: any) {
      console.warn(`[Gateway] Model ${modelToTry} failed:`, err.message || err);
      lastError = err;

      // Stop retrying on auth errors because every model will fail the same way.
      if (
        err.message?.includes("401") ||
        err.message?.includes("403") ||
        err.message?.toLowerCase().includes("unauthorized")
      ) {
        break;
      }
    }
  }

  throw lastError || new Error("All models in the fallback chain failed.");
}

function parseSuggestions(rawText: string) {
  const fallback = [
    "Summarize the key points from our chat",
    "Recommend the next best step",
    "Turn this into a clear action plan",
  ];

  try {
    const cleaned = rawText
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    const suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions;

    if (!Array.isArray(suggestions)) return fallback;

    const normalized = suggestions
      .map((item: any) => String(item || "").trim())
      .filter((item: string) => item.length >= 8 && item.length <= 120)
      .slice(0, 4);

    return normalized.length > 0 ? normalized : fallback;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Server API Routes
// ---------------------------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    gateway: "Vercel AI Gateway",
    timestamp: new Date().toISOString(),
  });
});

// Vercel AI Gateway Chat Proxy (using Vercel AI SDK)
app.post("/api/chat", async (req, res): Promise<any> => {
  try {
    const { message, history = [], thinking, files = [], model } = req.body;

    // Build system instruction
    let systemPrompt =
      "You are Gnim AI, a deep, thoughtful Private AI assistant built for productivity, creativity, and clarity. " +
      "Always respond in clear, elegant Markdown with structured headers, bullet points, checklists, and code formatting where appropriate.";

    if (thinking) {
      systemPrompt +=
        "\n\nCRITICAL CONTEXT: Thinking Mode is ACTIVE. Before you begin answering, you MUST perform deep reasoning. " +
        "Output your entire step-by-step thinking process inside a `<thinking>` tag " +
        "(e.g. `<thinking>My logical steps and self-correction...</thinking>`) " +
        "as the absolute FIRST part of your response. Then write your refined, markdown-styled final answer immediately after the closing tag.";
    } else {
      systemPrompt +=
        "\n\nThinking Mode is INACTIVE. Answer the user prompt directly and do not output any `<thinking>` tags.";
    }

    // Build conversation messages
    const messages = buildMessages(history, message, files);

    const { text: resultText, usedModel } = await runGatewayTextGeneration({
      model,
      system: systemPrompt,
      messages,
      maxOutputTokens: 8192,
    });

    return res.json({
      text: resultText,
      sources: [],
    });
  } catch (error: any) {
    console.error("[Gateway] Error:", error);

    const isQuotaError =
      error.message?.includes("429") ||
      error.message?.toLowerCase().includes("quota") ||
      error.message?.toLowerCase().includes("exhausted") ||
      error.message?.toLowerCase().includes("rate limit");

    const isAuthError =
      error.message?.includes("401") ||
      error.message?.includes("403") ||
      error.message?.toLowerCase().includes("unauthorized") ||
      error.message?.toLowerCase().includes("oidc");

    if (isAuthError) {
      return res.status(200).json({
        text: `🔑 **Authentication Failed — Vercel AI Gateway**

Your project is not linked to Vercel or is missing OIDC credentials.

### How to fix:
1. Install Vercel CLI: \`npm install -g vercel\`
2. Link your project: \`vercel link\`
3. Pull credentials: \`vercel env pull .env.local\`
4. Restart the server: \`npm run dev\`

Or set \`AI_GATEWAY_API_KEY\` in your \`.env\` file from the [Vercel Dashboard → AI Gateway](https://vercel.com/dashboard).`,
        sources: [],
      });
    }

    if (isQuotaError) {
      return res.status(200).json({
        text: `⚠️ **Rate Limit / Quota Exhausted**

The Vercel AI Gateway has hit a quota limit.

### How to resolve:
1. Check usage at [Vercel Dashboard → AI Gateway](https://vercel.com/dashboard)
2. Wait a few minutes and try again
3. Upgrade your Vercel plan for higher limits

*Technical Detail: ${error.message || "RESOURCE_EXHAUSTED"}*`,
        sources: [],
      });
    }

    // Safe fallback — always return JSON, never let Vite return HTML
    if (!res.headersSent) {
      return res.status(500).json({
        text: `⚠️ **Something went wrong**

${error.message || "An unexpected error occurred. Please try again."}

*If this keeps happening, restart the server with \`npm run dev\`.*`,
        sources: [],
      });
    }
  }
});

// ---------------------------------------------------------------------------
// AI SDK Suggestions Endpoint — recommends useful follow-up prompts
// ---------------------------------------------------------------------------
app.post("/api/suggestions", async (req, res): Promise<any> => {
  try {
    const { history = [], model } = req.body;
    const recentHistory = history
      .slice(-8)
      .map((chat: any) => `${chat.sender === "user" ? "User" : "Assistant"}: ${chat.text || ""}`)
      .join("\n\n");

    const prompt = recentHistory.trim()
      ? `Conversation so far:\n${recentHistory}\n\nReturn exactly 4 helpful next-prompt suggestions for the user.`
      : "Return exactly 4 helpful starter prompt suggestions for a private productivity AI assistant.";

    const { text } = await runGatewayTextGeneration({
      model,
      system:
        "You create concise, practical follow-up prompt suggestions for a chat UI. " +
        "Return ONLY valid JSON in this shape: {\"suggestions\":[\"...\",\"...\",\"...\",\"...\"]}. " +
        "Suggestions should be specific, useful, and under 90 characters each. Do not include markdown.",
      prompt,
      maxOutputTokens: 500,
    });

    return res.json({ suggestions: parseSuggestions(text) });
  } catch (error: any) {
    console.error("[Suggestions] Error:", error);
    return res.status(200).json({
      suggestions: parseSuggestions(""),
    });
  }
});

// ---------------------------------------------------------------------------
// Image Generation Endpoint — Google Imagen 4 Fast via Vercel AI Gateway
// ---------------------------------------------------------------------------
app.post("/api/generate-image", async (req, res): Promise<any> => {
  try {
    const { prompt, size = "1024x1024", model } = req.body;

    if (!prompt?.trim()) {
      return res.status(400).json({ error: "A prompt is required to generate an image." });
    }

    const modelToUse = model || "google/imagen-4.0-fast-generate-001";
    console.log(`[Image Gen] Prompt: "${prompt}" | Size: ${size} | Model: ${modelToUse}`);

    const { image } = await generateImage({
      model: gateway.image(modelToUse),
      prompt,
      size,
    });

    console.log(`[Image Gen] ✅ Image generated successfully`);

    return res.json({
      base64: image.base64,
      mimeType: image.mediaType || "image/png",
    });
  } catch (error: any) {
    console.error("[Image Gen] Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: error.message || "Failed to generate image. Please try again.",
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Video Generation Endpoint — Google Veo 3.1 Fast via Vercel AI Gateway
// ---------------------------------------------------------------------------
app.post("/api/generate-video", async (req, res): Promise<any> => {
  try {
    const { prompt, model } = req.body;

    if (!prompt?.trim()) {
      return res.status(400).json({ error: "A prompt is required to generate a video." });
    }

    const modelToUse = model || "google/veo-3.1-fast-generate-001";
    console.log(`[Video Gen] Prompt: "${prompt}" | Model: ${modelToUse}`);

    const { video } = await generateVideo({
      model: gateway.video(modelToUse),
      prompt,
    });

    console.log(`[Video Gen] ✅ Video generated successfully`);

    return res.json({
      base64: video.base64,
      mimeType: video.mediaType || "video/mp4",
    });
  } catch (error: any) {
    console.error("[Video Gen] Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: error.message || "Failed to generate video. Please try again.",
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Global Express error handler — ensures API errors always return JSON
// and never fall through to Vite's HTML error page
// ---------------------------------------------------------------------------
app.use((err: any, req: any, res: any, next: any) => {
  console.error("[Express] Unhandled error:", err);
  if (!res.headersSent) {
    res.status(500).json({
      text: `⚠️ **Server Error**\n\n${err.message || "An unexpected error occurred."}`,
      sources: [],
    });
  }
});

async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("✅ Vite middleware mounted in development mode.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("✅ Serving static files from /dist in production mode.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 Gnim AI running at http://localhost:${PORT}`);
    console.log(`🌐 Powered by Vercel AI Gateway`);
  });
}

initServer().catch((err) => {
  console.error("Failed to initialize server:", err);
});
