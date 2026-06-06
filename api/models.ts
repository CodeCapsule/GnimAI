export const config = {
  maxDuration: 15,
};

function normalizeModel(raw: any) {
  const id = String(raw?.id || "").trim();
  if (!id) return null;
  const name = String(raw?.name || raw?.label || id).trim();
  const capabilities = Array.isArray(raw?.capabilities)
    ? raw.capabilities.map((c: any) => String(c).toLowerCase())
    : [];
  return {
    id,
    name,
    provider: id.includes("/") ? id.split("/")[0] : undefined,
    capabilities,
  };
}

function inferType(model: any) {
  const id = String(model.id || "").toLowerCase();
  const caps = Array.isArray(model.capabilities) ? model.capabilities : [];
  const capText = caps.join(" ").toLowerCase();

  if (capText.includes("video") || id.includes("veo") || id.includes("seedance") || id.includes("ray-")) return "video";
  if (capText.includes("image") || id.includes("imagen") || id.includes("gpt-image") || id.includes("flux") || id.includes("stable-diffusion") || id.includes("seedream")) return "image";
  if (capText.includes("text") || capText.includes("chat") || capText.includes("code") || capText.includes("reasoning")) return "text";

  // Most Gateway models are language models unless their id clearly indicates media generation.
  return "text";
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
    const models = rawModels.map(normalizeModel).filter(Boolean) as any[];

    const grouped = { text: [] as any[], image: [] as any[], video: [] as any[] };
    for (const model of models) {
      grouped[inferType(model) as "text" | "image" | "video"].push(model);
    }

    for (const key of Object.keys(grouped) as Array<keyof typeof grouped>) {
      grouped[key].sort((a, b) => a.id.localeCompare(b.id));
    }

    return res.status(200).json({ ...grouped, source: "vercel-ai-gateway" });
  } catch (error: any) {
    console.error("[api/models]", error);
    return res.status(200).json({ text: [], image: [], video: [], source: "fallback", error: error.message });
  }
}
