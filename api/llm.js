// TEMPORARY: OpenRouter test backend. Removed when the Cerebras integration lands (see src/llm/provider.ts).
// The key lives only in the OPENROUTER_API_KEY environment variable, never in the browser bundle.

const UPSTREAM = "https://openrouter.ai/api/v1/chat/completions"
const MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash-lite"
const MAX_TOKENS = 1500
const MAX_CHARS = 40000

export default async function handler(req, res) {
  if (req.method !== "POST") return void res.status(405).json({ error: "POST only" })

  const key = process.env.OPENROUTER_API_KEY
  if (!key) return void res.status(500).json({ error: "OPENROUTER_API_KEY is not set" })

  const origin = req.headers.origin
  if (origin && new URL(origin).host !== req.headers.host) return void res.status(403).json({ error: "cross-origin request refused" })

  const { system, user, temperature = 0.8, maxTokens = 800, stream = false, json = false } = req.body ?? {}
  if (typeof system !== "string" || typeof user !== "string" || system.length + user.length > MAX_CHARS)
    return void res.status(400).json({ error: "bad request" })

  const upstream = await fetch(UPSTREAM, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Title": "Atelier (test)" },
    body: JSON.stringify({
      model: MODEL,
      stream: Boolean(stream),
      temperature: Math.min(1.2, Math.max(0, Number(temperature))),
      max_tokens: Math.min(MAX_TOKENS, Math.max(16, Number(maxTokens))),
      ...(json ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  })

  res.status(upstream.status)
  res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "application/json")
  res.setHeader("Cache-Control", "no-store")
  if (!upstream.body) return void res.end()
  for await (const chunk of upstream.body) res.write(chunk)
  res.end()
}
