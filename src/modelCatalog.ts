import { GatewayModelsState, GatewayModelOption } from "./types";

export const RECOMMENDED_TEXT_MODELS: GatewayModelOption[] = [
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro" },
  { id: "google/gemini-2.0-flash", name: "Gemini 2.0 Flash" },
  { id: "google/gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite" },
  { id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6" },
  { id: "anthropic/claude-3-5-sonnet", name: "Claude 3.5 Sonnet" },
  { id: "anthropic/claude-3-5-haiku", name: "Claude 3.5 Haiku" },
  { id: "openai/gpt-4o", name: "GPT-4o" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "xai/grok-4.1-fast-non-reasoning", name: "Grok 4.1 Fast" },
  { id: "meta/llama-4-maverick", name: "Llama 4 Maverick" },
  { id: "mistral/mistral-large-latest", name: "Mistral Large" },
  { id: "deepseek/deepseek-chat", name: "DeepSeek Chat" },
];

export const RECOMMENDED_IMAGE_MODELS: GatewayModelOption[] = [
  { id: "xai/grok-imagine-image", name: "Grok Imagine Image" },
  { id: "google/imagen-4.0-fast-generate-001", name: "Imagen 4 Fast" },
  { id: "google/imagen-4.0-generate-001", name: "Imagen 4" },
  { id: "google/imagen-3.0-generate-002", name: "Imagen 3" },
  { id: "bfl/flux-2-flex", name: "FLUX 2 Flex" },
  { id: "stability/stable-diffusion-3.5-large", name: "Stable Diffusion 3.5 Large" },
  { id: "bytedance/seedream-4.0", name: "Seedream 4.0" },
  { id: "bytedance/seedream-4.5", name: "Seedream 4.5" },
];

export const RECOMMENDED_VIDEO_MODELS: GatewayModelOption[] = [
  { id: "xai/grok-imagine-video", name: "Grok Imagine Video" },
  { id: "xai/grok-imagine-video-1.5-preview", name: "Grok Imagine Video 1.5 Preview" },
  { id: "google/veo-3.1-fast-generate-001", name: "Veo 3.1 Fast" },
  { id: "google/veo-2.0-generate-001", name: "Veo 2" },
  { id: "bytedance/seedance-2.0", name: "Seedance 2.0" },
  { id: "luma/ray-2", name: "Ray 2" },
];

export const FALLBACK_GATEWAY_MODELS: GatewayModelsState = {
  text: RECOMMENDED_TEXT_MODELS,
  image: RECOMMENDED_IMAGE_MODELS,
  video: RECOMMENDED_VIDEO_MODELS,
};

export const SUPPORTED_MODEL_IDS = {
  text: new Set(RECOMMENDED_TEXT_MODELS.map((model) => model.id)),
  image: new Set(RECOMMENDED_IMAGE_MODELS.map((model) => model.id)),
  video: new Set(RECOMMENDED_VIDEO_MODELS.map((model) => model.id)),
};

export function labelForModel(model: GatewayModelOption) {
  return model.name || model.id;
}

export function providerForModel(model: GatewayModelOption) {
  if (model.provider) return model.provider;
  return model.id.includes("/") ? model.id.split("/")[0] : "gateway";
}
