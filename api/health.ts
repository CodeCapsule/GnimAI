export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return res.status(200).json({
    status: "healthy",
    runtime: "vercel-function",
    gateway: "Vercel AI Gateway",
    auth: process.env.VERCEL_OIDC_TOKEN ? "vercel-oidc" : "local-or-api-key",
    timestamp: new Date().toISOString(),
  });
}
