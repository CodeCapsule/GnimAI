# AI SDK + Vercel AI Gateway Option A Notes

## Goal

Use the full keyless Vercel AI Gateway path by moving AI requests from the Express server into Vercel Functions.

## Implemented endpoints

- `api/chat.ts` — text chat through AI Gateway
- `api/suggestions.ts` — follow-up prompt recommendations
- `api/generate-image.ts` — image generation
- `api/generate-video.ts` — video generation
- `api/health.ts` — deployment/auth check
- `api/_gateway.ts` — shared helpers, model fallback, error formatting

## Important behavior

In production, deploy to Vercel and call the `/api/*` endpoints from the React app. The AI requests must originate from the Vercel Functions, not from the browser and not from a separate Express server.

If AI Gateway shows `No Project`, then the request is not attached to a deployed Vercel project. The most common causes are local testing, using an API key directly, or calling AI Gateway from another server.

## How to confirm OIDC

After deployment, visit:

```txt
/api/health
```

Expected production result:

```json
{
  "runtime": "vercel-function",
  "auth": "vercel-oidc"
}
```

Then send one chat message and check Vercel AI Gateway usage. The request should appear under your project name instead of `No Project`.

## Local testing

For local function testing:

```bash
npx vercel link
npx vercel dev
```

Local runs may still require `AI_GATEWAY_API_KEY`. That is okay for local testing only. Do not add it to production if you want keyless project authentication.

## Security recommendations

1. Keep all AI calls server-side in `/api`.
2. Do not expose AI Gateway keys in React.
3. Add rate limiting before public release.
4. Add request logging and model usage tracking.
5. Validate user-selected model IDs server-side.
