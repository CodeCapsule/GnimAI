import { gateway, generateImage, getRequestBody, sendJson } from "./_gateway.js";

export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });

  try {
    const { prompt, size = "1024x1024", model } = getRequestBody(req);
    if (!prompt?.trim()) return sendJson(res, 400, { error: "A prompt is required to generate an image." });

    const modelToUse = model || "google/imagen-4.0-fast-generate-001";
    const { image } = await generateImage({
      model: gateway.image(modelToUse),
      prompt,
      size,
    });

    return sendJson(res, 200, {
      base64: image.base64,
      mimeType: image.mediaType || "image/png",
    });
  } catch (error: any) {
    console.error("[api/generate-image]", error);
    return sendJson(res, 500, { error: error.message || "Failed to generate image." });
  }
}
