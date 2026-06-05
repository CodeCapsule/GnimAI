/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { generateText } from "ai";
import dotenv from "dotenv";

// Load .env.local first (Vercel OIDC token), then fall back to .env
dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const PORT = 3000;

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
    const { message, history = [], thinking, files = [] } = req.body;

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

    // Fallback chain — Vercel AI Gateway automatically handles auth via OIDC on Vercel
    // Locally, it uses AI_GATEWAY_API_KEY from .env.local or .env
    const modelChain = [
      "google/gemini-2.5-flash",
      "google/gemini-2.0-flash",
      "google/gemini-2.0-flash-lite",
    ];

    let resultText = "";
    let lastError: any = null;
    let usedModel = "";

    for (const model of modelChain) {
      try {
        console.log(`[Gateway] Trying model: ${model}`);

        const result = await generateText({
          model: model as any,
          system: systemPrompt,
          messages,
          maxTokens: 8192,
        });

        resultText = result.text ?? "";
        usedModel = model;
        break;
      } catch (err: any) {
        console.warn(`[Gateway] Model ${model} failed:`, err.message || err);
        lastError = err;

        // Stop retrying on auth errors
        if (
          err.message?.includes("401") ||
          err.message?.includes("403") ||
          err.message?.toLowerCase().includes("unauthorized")
        ) {
          break;
        }
      }
    }

    if (!usedModel) {
      throw lastError || new Error("All models in the fallback chain failed.");
    }

    console.log(`[Gateway] Response served via: ${usedModel}`);

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

    return res.status(500).json({
      error:
        error.message ||
        "An unexpected error occurred while communicating with Gnim AI.",
    });
  }
});

// ---------------------------------------------------------------------------
// Setup Vite Dev server or production static serving
// ---------------------------------------------------------------------------
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
