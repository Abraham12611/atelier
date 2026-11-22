/**
 * TEMPORARY test backend: every call goes through our own `/api/llm` proxy, which holds the OpenRouter key server-side.
 * Replaced by the Cerebras integration; then delete this file, `api/llm.js` and the line in `provider.ts`.
 */
import type { Answer, DecisionRequest, DecisionResponse, Question } from "./decisions.ts"

const ENDPOINT = "/api/llm"

/** The proxy holds the key, so the browser has nothing to store. */
export const storedApiKey = () => "server"
export const storedGeminiKey = () => "server"

export type CompletionRequest = {
  apiKey: string
  system: string
  user: string
  temperature: number
  maxCompletionTokens: number
  signal: AbortSignal
}

export async function* streamCompletion({ system, user, temperature, maxCompletionTokens, signal }: CompletionRequest) {
  const response = await post({ system, user, temperature, maxTokens: maxCompletionTokens, stream: true }, signal)
  if (!response.body) throw new Error("no response body")

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) return
    buffer += value

    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      const data = line.startsWith("data:") ? line.slice(5).trim() : ""
      if (!data || data === "[DONE]") continue
      const content = JSON.parse(data).choices?.[0]?.delta?.content
      if (content) yield content as string
    }
  }
}

/**
 * Stands in for the Gemini decisions API: asks a small chat model to rate each question and parses its JSON.
 * Scores are the 0-based index of the level that applies; yes/no questions are a probability from 0 to 1.
 */
export async function createDecisions(_apiKey: string, { input, questions }: DecisionRequest, signal: AbortSignal): Promise<DecisionResponse> {
  const text = typeof input === "string" ? input : input.map((block) => (block.type === "text" ? block.text : "")).join("\n")
  const system = `You rate text. Answer every question and reply with one JSON object that maps each question id to its answer, and nothing else.
- A "score" question lists numbered levels (0 is the lowest). Answer with the integer number of the level that fits best.
- A "yesno" question: answer with a number from 0 to 1, the probability that the answer is yes.`
  const user = `${text}\n\nQUESTIONS\n${Object.entries(questions).map(([id, question]) => describe(id, question)).join("\n")}`

  const response = await post({ system, user, temperature: 0, maxTokens: 600, json: true }, signal)
  const body = await response.json()
  const parsed = parseJson(body.choices?.[0]?.message?.content ?? "")

  const answers: Record<string, Answer> = {}
  for (const [id, question] of Object.entries(questions)) {
    const value = Number(parsed[id])
    if (!Number.isFinite(value)) continue
    if (question.type === "score") {
      const score = Math.min(question.criteria.length - 1, Math.max(0, Math.round(value)))
      answers[id] = { type: "score", score, probabilities: {}, legend: {}, confidence: 1 }
    } else if (question.type === "noul") {
      answers[id] = { type: "noul", noul: Math.min(1, Math.max(0, value)), confidence: 1 }
    }
  }
  return { answers, usage: body.usage ?? { total_input_tokens: 0, input_tokens_by_modality: [], total_output_tokens: 0, total_tokens: 0 } }
}

function describe(id: string, question: Question) {
  if (question.type === "score") return `${id} (score): ${question.instructions}\n${question.criteria.map((level, i) => `  ${i} = ${level}`).join("\n")}`
  if (question.type === "noul")
    return `${id} (yesno): ${question.instructions} Yes means: ${question.criteria?.true_description ?? "true"} No means: ${question.criteria?.false_description ?? "false"}`
  return `${id}: ${question.instructions}`
}

function parseJson(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1))
  } catch {
    return {}
  }
}

async function post(body: object, signal: AbortSignal) {
  const response = await fetch(ENDPOINT, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  if (!response.ok) throw new Error(`${response.status} ${(await response.text()).slice(0, 300)}`)
  return response
}
