import { sendJson } from "./_gateway";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });

  return sendJson(res, 200, {
    status: "healthy",
    runtime: "vercel-function",
    gateway: "Vercel AI Gateway",
    auth: process.env.VERCEL_OIDC_TOKEN ? "vercel-oidc" : "local-or-api-key",
    timestamp: new Date().toISOString(),
  });
}
