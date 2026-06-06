export const config = {
  maxDuration: 15,
};

const SUPPORTED = {
  text: new Map([
    ["google/gemini-2.5-flash", "Gemini 2.5 Flash"],
    ["google/gemini-2.5-pro", "Gemini 2.5 Pro"],
    ["google/gemini-2.0-flash", "Gemini 2.0 Flash"],
    ["google/gemini-2.0-flash-lite", "Gemini 2.0 Flash Lite"],
    ["anthropic/claude-sonnet-4.6", "Claude Sonnet 4.6"],
    ["anthropic/claude-3-5-sonnet", "Claude 3.5 Sonnet"],
    ["anthropic/claude-3-5-haiku", "Claude 3.5 Haiku"],
    ["openai/gpt-4o", "GPT-4o"],
    ["openai/gpt-4o-mini", "GPT-4o Mini"],
    ["xai/grok-4.1-fast-non-reasoning", "Grok 4.1 Fast"],
    ["meta/llama-4-maverick", "Llama 4 Maverick"],
    ["mistral/mistral-large-latest", "Mistral Large"],
    ["deepseek/deepseek-chat", "DeepSeek Chat"],
  ]),
  image: new Map([
    ["xai/grok-imagine-image", "Grok Imagine Image"],
    ["google/imagen-4.0-fast-generate-001", "Imagen 4 Fast"],
    ["google/imagen-4.0-generate-001", "Imagen 4"],
    ["google/imagen-3.0-generate-002", "Imagen 3"],
    ["bfl/flux-2-flex", "FLUX 2 Flex"],
    ["stability/stable-diffusion-3.5-large", "Stable Diffusion 3.5 Large"],
    ["bytedance/seedream-4.0", "Seedream 4.0"],
    ["bytedance/seedream-4.5", "Seedream 4.5"],
  ]),
  video: new Map([
    ["xai/grok-imagine-video", "Grok Imagine Video"],
    ["xai/grok-imagine-video-1.5-preview", "Grok Imagine Video 1.5 Preview"],
    ["google/veo-3.1-fast-generate-001", "Veo 3.1 Fast"],
    ["google/veo-2.0-generate-001", "Veo 2"],
    ["bytedance/seedance-2.0", "Seedance 2.0"],
    ["luma/ray-2", "Ray 2"],
  ]),
};

function option(id: string, name: string) {
  return {
    id,
    name,
    provider: id.includes("/") ? id.split("/")[0] : "gateway",
  };
}

function fallbackModels() {
  return {
    text: Array.from(SUPPORTED.text.entries()).map(([id, name]) => option(id, name)),
    image: Array.from(SUPPORTED.image.entries()).map(([id, name]) => option(id, name)),
    video: Array.from(SUPPORTED.video.entries()).map(([id, name]) => option(id, name)),
  };
}

function filterGatewayModels(rawModels: any[]) {
  const grouped = fallbackModels();
  const rawIds = new Set(rawModels.map((model) => String(model?.id || "").trim()).filter(Boolean));

  // Only expose safe/recommended Gateway IDs. This prevents models such as
  // openai/gpt-image-2 from appearing when they require ZDR/BYOK credentials.
  for (const key of Object.keys(SUPPORTED) as Array<keyof typeof SUPPORTED>) {
    const filtered = Array.from(SUPPORTED[key].entries())
      .filter(([id]) => rawIds.has(id))
      .map(([id, name]) => option(id, name));

    if (filtered.length > 0) grouped[key] = filtered;
  }

  return grouped;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/models", {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) throw new Error(`Gateway models endpoint returned ${response.status}`);

    const json = await response.json();
    const rawModels = Array.isArray(json?.data) ? json.data : [];
    return res.status(200).json({ ...filterGatewayModels(rawModels), source: "vercel-ai-gateway-filtered" });
  } catch (error: any) {
    console.error("[api/models]", error);
    return res.status(200).json({ ...fallbackModels(), source: "recommended-fallback", error: error.message });
  }
}
