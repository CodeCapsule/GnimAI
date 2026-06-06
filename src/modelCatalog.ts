import { GatewayModelsState, GatewayModelOption } from "./types";

export const FALLBACK_GATEWAY_MODELS: GatewayModelsState = {
  text: [
    { id: "google/gemini-2.5-flash", name: "Google Gemini 2.5 Flash" },
    { id: "google/gemini-2.5-pro", name: "Google Gemini 2.5 Pro" },
    { id: "google/gemini-2.0-flash", name: "Google Gemini 2.0 Flash" },
    { id: "google/gemini-2.0-flash-lite", name: "Google Gemini 2.0 Flash Lite" },
    { id: "anthropic/claude-sonnet-4.6", name: "Anthropic Claude Sonnet 4.6" },
    { id: "anthropic/claude-3-5-sonnet", name: "Anthropic Claude 3.5 Sonnet" },
    { id: "anthropic/claude-3-5-haiku", name: "Anthropic Claude 3.5 Haiku" },
    { id: "openai/gpt-4o", name: "OpenAI GPT-4o" },
    { id: "openai/gpt-4o-mini", name: "OpenAI GPT-4o Mini" },
    { id: "xai/grok-4.1-fast-non-reasoning", name: "xAI Grok 4.1 Fast" },
    { id: "meta/llama-4-maverick", name: "Meta Llama 4 Maverick" },
    { id: "mistral/mistral-large-latest", name: "Mistral Large" },
    { id: "deepseek/deepseek-chat", name: "DeepSeek Chat" },
  ],
  image: [
    { id: "google/imagen-4.0-fast-generate-001", name: "Google Imagen 4.0 Fast" },
    { id: "google/imagen-4.0-generate-001", name: "Google Imagen 4.0" },
    { id: "google/imagen-3.0-generate-002", name: "Google Imagen 3.0" },
    { id: "openai/gpt-image-1", name: "OpenAI GPT Image 1" },
    { id: "openai/gpt-image-2", name: "OpenAI GPT Image 2" },
    { id: "bfl/flux-2-flex", name: "BFL FLUX 2 Flex" },
    { id: "stability/stable-diffusion-3.5-large", name: "Stability SD 3.5 Large" },
    { id: "bytedance/seedream-4.0", name: "ByteDance Seedream 4.0" },
    { id: "bytedance/seedream-4.5", name: "ByteDance Seedream 4.5" },
  ],
  video: [
    { id: "google/veo-3.1-fast-generate-001", name: "Google Veo 3.1 Fast" },
    { id: "google/veo-2.0-generate-001", name: "Google Veo 2.0" },
    { id: "bytedance/seedance-2.0", name: "ByteDance Seedance 2.0" },
    { id: "luma/ray-2", name: "Luma Ray 2" },
  ],
};

export function labelForModel(model: GatewayModelOption) {
  return model.name && model.name !== model.id ? `${model.name} (${model.id})` : model.id;
}
