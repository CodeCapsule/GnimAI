import { generateText, gateway, generateImage, experimental_generateVideo as generateVideo } from "ai";

export function getRequestBody(req: any) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export function sendJson(res: any, status: number, payload: unknown) {
  res.status(status).json(payload);
}

export function buildMessages(history: any[] = [], currentMessage = "", files: any[] = []) {
  const maxHistoryCount = 15;
  const recentHistory = history.slice(-maxHistoryCount);

  const messages: any[] = recentHistory.map((chat: any) => {
    const contentParts: any[] = [];

    if (chat.files && chat.files.length > 0) {
      for (const file of chat.files) {
        if (file.base64 && file.type?.startsWith("image/")) {
          const base64Data = file.base64.includes(",") ? file.base64.split(",")[1] : file.base64;
          contentParts.push({ type: "image", image: base64Data, mimeType: file.type });
        }
      }
    }

    contentParts.push({ type: "text", text: chat.text || "" });

    return {
      role: chat.sender === "user" ? "user" : "assistant",
      content: contentParts.length === 1 ? chat.text || "" : contentParts,
    };
  });

  const currentParts: any[] = [];
  if (files && files.length > 0) {
    for (const file of files) {
      if (file.base64 && file.type?.startsWith("image/")) {
        const base64Data = file.base64.includes(",") ? file.base64.split(",")[1] : file.base64;
        currentParts.push({ type: "image", image: base64Data, mimeType: file.type });
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

export function getModelFallbackChain(model?: string) {
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

export async function runGatewayTextGeneration({
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
      const result = await generateText({
        model: gateway(modelToTry) as any,
        system,
        messages,
        prompt,
        maxOutputTokens,
      } as any);

      return {
        text: result.text ?? "",
        usedModel: modelToTry,
      };
    } catch (err: any) {
      lastError = err;
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

export function parseSuggestions(rawText: string) {
  const fallback = [
    "Summarize the key points from our chat",
    "Recommend the next best step",
    "Turn this into a clear action plan",
    "Create a simple checklist for me",
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

export function formatGatewayError(error: any) {
  const message = error?.message || "An unexpected error occurred.";

  const isQuotaError =
    message.includes("429") ||
    message.toLowerCase().includes("quota") ||
    message.toLowerCase().includes("exhausted") ||
    message.toLowerCase().includes("rate limit");

  const isAuthError =
    message.includes("401") ||
    message.includes("403") ||
    message.toLowerCase().includes("unauthorized") ||
    message.toLowerCase().includes("oidc");

  if (isAuthError) {
    return `🔑 **Vercel AI Gateway authentication failed**\n\nThis build is configured for keyless OIDC on Vercel.\n\n### Fix for production\n1. Deploy this app to Vercel.\n2. Open your Vercel Project → Settings → AI Gateway.\n3. Enable AI Gateway / OIDC keyless authentication.\n4. Redeploy the project.\n\n### Local development\nOIDC is automatically available on Vercel deployments. For local testing, use \`vercel dev\` after \`vercel link\`, or temporarily set \`AI_GATEWAY_API_KEY\` locally only.`;
  }

  if (isQuotaError) {
    return `⚠️ **Rate limit or quota reached**\n\nYour Vercel AI Gateway credits or limits may have been reached. Check your Vercel Dashboard → AI Gateway usage.\n\n*Technical detail: ${message}*`;
  }

  return `⚠️ **Something went wrong**\n\n${message}`;
}

export { gateway, generateImage, generateVideo };
