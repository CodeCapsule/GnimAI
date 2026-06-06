import { gateway, generateVideo, getRequestBody, sendJson } from "./_gateway.js";

export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });

  try {
    const { prompt, model } = getRequestBody(req);
    if (!prompt?.trim()) return sendJson(res, 400, { error: "A prompt is required to generate a video." });

    const modelToUse = model || "google/veo-3.1-fast-generate-001";
    const { video } = await generateVideo({
      model: gateway.video(modelToUse),
      prompt,
    });

    return sendJson(res, 200, {
      base64: video.base64,
      mimeType: video.mediaType || "video/mp4",
    });
  } catch (error: any) {
    console.error("[api/generate-video]", error);
    return sendJson(res, 500, { error: error.message || "Failed to generate video." });
  }
}
