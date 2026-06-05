/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Vercel AI Gateway endpoint
const AI_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";

// Increase request size to support file attachments base64 uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ---------------------------------------------------------------------------
// Helper: call Vercel AI Gateway with a specific model
// ---------------------------------------------------------------------------
async function callGateway(
  apiKey: string,
  model: string,
  messages: any[],
  systemInstruction: string
): Promise<{ text: string }> {
  const allMessages = [
    { role: "system", content: systemInstruction },
    ...messages,
  ];

  const response = await fetch(`${AI_GATEWAY_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: allMessages,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw Object.assign(new Error(errBody || response.statusText), {
      status: response.status,
    });
  }

  const data = (await response.json()) as any;
  const text = data.choices?.[0]?.message?.content ?? "";
  return { text };
}

// ---------------------------------------------------------------------------
// Helper: map our chat history to OpenAI-compatible messages
// ---------------------------------------------------------------------------
function buildMessages(
  history: any[],
  currentMessage: string,
  files: any[]
): any[] {
  const maxHistoryCount = 15;
  const recentHistory = history.slice(-maxHistoryCount);

  const messages: any[] = recentHistory.map((chat: any) => {
    const contentParts: any[] = [];

    // Include file attachments from history
    if (chat.files && chat.files.length > 0) {
      for (const file of chat.files) {
        if (file.base64 && file.type?.startsWith("image/")) {
          const base64Data = file.base64.includes(",")
            ? file.base64
            : `data:${file.type};base64,${file.base64}`;
          contentParts.push({
            type: "image_url",
            image_url: { url: base64Data },
          });
        }
      }
    }

    contentParts.push({ type: "text", text: chat.text || "" });

    return {
      role: chat.sender === "user" ? "user" : "assistant",
      content: contentParts.length === 1 ? contentParts[0].text : contentParts,
    };
  });

  // Build current user message
  const currentParts: any[] = [];
  if (files && files.length > 0) {
    for (const file of files) {
      if (file.base64 && file.type?.startsWith("image/")) {
        const base64Data = file.base64.includes(",")
          ? file.base64
          : `data:${file.type};base64,${file.base64}`;
        currentParts.push({
          type: "image_url",
          image_url: { url: base64Data },
        });
      }
    }
  }
  currentParts.push({ type: "text", text: currentMessage });

  messages.push({
    role: "user",
    content: currentParts.length === 1 ? currentParts[0].text : currentParts,
  });

  return messages;
}

// ---------------------------------------------------------------------------
// Server API Routes
// ---------------------------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Vercel AI Gateway Chat Proxy
app.post("/api/chat", async (req, res): Promise<any> => {
  try {
    const { message, history = [], thinking, files = [] } = req.body;

    // Resolve API key — prefer AI_GATEWAY_API_KEY, fall back to GEMINI_API_KEY
    const apiKey =
      process.env.AI_GATEWAY_API_KEY ||
      process.env.GEMINI_API_KEY ||
      "";

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      return res.status(500).json({
        error:
          "No API key configured. Set AI_GATEWAY_API_KEY (from Vercel Dashboard → AI Gateway) in your .env file.",
      });
    }

    // Build system instruction
    let systemInstruction =
      "You are Gnim AI, a deep, thoughtful Private AI assistant built for productivity, creativity, and clarity. " +
      "Always respond in clear, elegant Markdown with structured headers, bullet points, checklists, and code formatting where appropriate.";

    if (thinking) {
      systemInstruction +=
        "\n\nCRITICAL CONTEXT: Thinking Mode is ACTIVE. Before you begin answering, you MUST perform deep reasoning. " +
        "Output your entire step-by-step thinking process inside a `<thinking>` tag (e.g. `<thinking>My logical steps and self-correction...</thinking>`) " +
        "as the absolute FIRST part of your response. Then write your refined, markdown-styled final answer immediately after the closing tag.";
    } else {
      systemInstruction +=
        "\n\nThinking Mode is INACTIVE. Answer the user prompt directly and do not output any `<thinking>` tags.";
    }

    // Convert history + current message to OpenAI format
    const messages = buildMessages(history, message, files);

    // Fallback chain: try models in order
    const modelChain = [
      "google/gemini-2.5-flash",
      "google/gemini-2.0-flash",
      "google/gemini-2.0-flash-lite",
    ];

    let result: { text: string } | null = null;
    let lastError: any = null;
    let usedModel = "";

    for (const model of modelChain) {
      try {
        console.log(`Attempting model: ${model}`);
        result = await callGateway(apiKey, model, messages, systemInstruction);
        usedModel = model;
        break;
      } catch (err: any) {
        console.warn(`Model ${model} failed:`, err.message || err);
        lastError = err;

        // Don't retry on auth errors
        if (err.status === 401 || err.status === 403) break;
      }
    }

    if (!result) {
      throw lastError || new Error("All models in the fallback chain failed.");
    }

    console.log(`Response served via: ${usedModel}`);

    return res.json({
      text: result.text,
      sources: [], // Web search disabled — routed through Gateway
    });
  } catch (error: any) {
    console.error("Gateway proxy error:", error);

    const isQuotaError =
      error.status === 429 ||
      error.message?.includes("429") ||
      error.message?.toLowerCase().includes("quota") ||
      error.message?.toLowerCase().includes("exhausted") ||
      error.message?.toLowerCase().includes("rate limit");

    const isAuthError =
      error.status === 401 ||
      error.status === 403 ||
      error.message?.includes("401") ||
      error.message?.includes("403") ||
      error.message?.toLowerCase().includes("unauthorized");

    if (isAuthError) {
      return res.status(200).json({
        text: `🔑 **Authentication Failed**

Your \`AI_GATEWAY_API_KEY\` is missing or invalid.

### How to fix:
1. Go to your [Vercel Dashboard → AI Gateway → API Keys](https://vercel.com/dashboard)
2. Click **Create Key** and copy it
3. Add it to your \`.env\` file:
   \`\`\`
   AI_GATEWAY_API_KEY=vgat_your_key_here
   \`\`\`
4. Restart the server with \`npm run dev\``,
        sources: [],
      });
    }

    if (isQuotaError) {
      return res.status(200).json({
        text: `⚠️ **Rate Limit / Quota Exhausted**

The Vercel AI Gateway has hit a rate limit or quota for your account.

### How to resolve:
1. Check your usage at the [Vercel AI Gateway Dashboard](https://vercel.com/dashboard)
2. Wait a few minutes for the rate limit to reset
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
    console.log(`🌐 AI Gateway: ${AI_GATEWAY_BASE_URL}`);
  });
}

initServer().catch((err) => {
  console.error("Failed to initialize server:", err);
});
