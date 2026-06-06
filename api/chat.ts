import { buildMessages, formatGatewayError, getRequestBody, runGatewayTextGeneration, sendJson } from "./_gateway.js";

export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });

  try {
    const { message, history = [], thinking, files = [], model } = getRequestBody(req);

    let systemPrompt =
      "You are Gnim AI, a thoughtful private AI assistant built for productivity, creativity, and clarity. " +
      "Always respond in clear Markdown with useful structure, examples, and next steps where helpful.";

    if (thinking) {
      systemPrompt +=
        "\n\nThinking Mode is active. Give a brief reasoning summary before the final answer, but do not reveal hidden chain-of-thought.";
    } else {
      systemPrompt += "\n\nThinking Mode is inactive. Answer directly and do not use thinking tags.";
    }

    const messages = buildMessages(history, message, files);

    const { text, usedModel } = await runGatewayTextGeneration({
      model,
      system: systemPrompt,
      messages,
      maxOutputTokens: 8192,
    });

    return sendJson(res, 200, { text, usedModel, sources: [] });
  } catch (error: any) {
    console.error("[api/chat]", error);
    return sendJson(res, 200, { text: formatGatewayError(error), sources: [] });
  }
}
