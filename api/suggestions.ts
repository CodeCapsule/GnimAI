import { getRequestBody, parseSuggestions, runGatewayTextGeneration, sendJson } from "./_gateway.js";

export const config = {
  maxDuration: 30,
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });

  try {
    const { history = [], model } = getRequestBody(req);
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

    return sendJson(res, 200, { suggestions: parseSuggestions(text) });
  } catch (error: any) {
    console.error("[api/suggestions]", error);
    return sendJson(res, 200, { suggestions: parseSuggestions("") });
  }
}
