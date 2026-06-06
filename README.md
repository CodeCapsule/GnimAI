# Gnim AI

> Your private AI assistant built for productivity, creativity, and clarity.

Gnim AI is a React + TypeScript chat web app powered by the **Vercel AI SDK** and **Vercel AI Gateway**.

This build uses **Option A**: all AI requests are moved into `/api` Vercel Functions so your deployed Vercel project can use keyless AI Gateway authentication. No provider API keys are stored in the React app.

---

## What changed for Option A

- AI chat now runs through `/api/chat`.
- Prompt suggestions now run through `/api/suggestions`.
- Image generation now runs through `/api/generate-image`.
- Video generation now runs through `/api/generate-video`.
- `/api/health` was added so you can confirm the API is running as a Vercel Function.
- Production build no longer bundles `server.ts`.
- `server.ts` is kept only as a legacy/local Express fallback.

---

## Deployment for keyless AI Gateway

1. Push this folder to GitHub.
2. Import the repo into Vercel as a project.
3. Deploy normally.
4. Do **not** add `AI_GATEWAY_API_KEY` for production.
5. After deployment, open:

```txt
https://your-project.vercel.app/api/health
```

You should see:

```json
{
  "runtime": "vercel-function",
  "auth": "vercel-oidc"
}
```

If AI Gateway usage still appears under **No Project**, the request is not coming from the deployed Vercel Function.

---

## Local development

Install dependencies:

```bash
npm install
```

For frontend-only local work:

```bash
npm run dev
```

For the closest production-like local setup with Vercel Functions:

```bash
npx vercel link
npx vercel dev
```

Local development may still need a temporary `AI_GATEWAY_API_KEY` because keyless OIDC is meant for deployed Vercel Functions.

Do not commit `.env.local`.

---

## Project structure

```txt
gnim-ai/
├── api/
│   ├── _gateway.ts
│   ├── chat.ts
│   ├── suggestions.ts
│   ├── generate-image.ts
│   ├── generate-video.ts
│   └── health.ts
├── src/
├── server.ts              # legacy/local Express fallback only
├── vercel.json
└── package.json
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run Vite frontend locally |
| `npm run dev:vercel` | Run Vercel Functions locally |
| `npm run dev:express` | Run old Express fallback |
| `npm run build` | Build frontend for Vercel |
| `npm start` | Preview built frontend |
| `npm run lint` | Type-check project |

---

## Recommendations

- Keep all model calls inside `/api` only.
- Do not call AI Gateway directly from React.
- Add rate limiting before public launch to protect credits.
- Track model name, request time, success/failure, and estimated token usage.
- Add streaming later with `streamText()` for a smoother chat experience.


### Grok Imagine support

This build includes xAI Grok Imagine via Vercel AI Gateway:

- `xai/grok-imagine-image` for image generation
- `xai/grok-imagine-video` and `xai/grok-imagine-video-1.5-preview` for video generation

If a model fails, check your Vercel AI Gateway access, credits, and project logs.
