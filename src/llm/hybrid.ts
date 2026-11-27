import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode, type GenerativeModel } from "firebase/ai"
import { app } from "../firebase/app.ts"
import type { Answer, DecisionRequest, DecisionResponse, Question } from "./decisions.ts"
import { recordInference } from "./inference-stats.ts"

/**
 * Hybrid inference through Firebase AI Logic: one call site, two places it can run.
 * Short, structured tasks (key phrases, steering menus, scoring) prefer the on-device model (private, free, offline);
 * long continuations prefer the cloud model, falling back to the device when offline.
 */
export type Task = "continuation" | "structured"

const CLOUD_MODEL = "gemini-3.5-flash-lite"
const MODE: Record<Task, InferenceMode> = {
  continuation: InferenceMode.PREFER_IN_CLOUD,
  structured: InferenceMode.PREFER_ON_DEVICE,
}

const ai = getAI(app, { backend: new GoogleAIBackend() })

export const storedApiKey = () => "firebase"
export const storedGeminiKey = () => "firebase"

export type CompletionRequest = {
  apiKey?: string
  system: string
  user: string
  temperature: number
  maxCompletionTokens: number
  signal: AbortSignal
  task?: Task
}

const models = new Map<string, GenerativeModel>()
let isUserActive = false
for (const type of ["pointerdown", "keydown"]) addEventListener(type, () => (isUserActive = true), { once: true, capture: true })

function modelFor(task: Task, system: string, temperature: number, maxOutputTokens: number, json: boolean) {
  const key = JSON.stringify([task, system, temperature, maxOutputTokens, json])
  let model = models.get(key)
  if (!model) {
    model = getGenerativeModel(ai, {
      mode: MODE[task],
      inCloudParams: {
        model: CLOUD_MODEL,
        systemInstruction: system,
        generationConfig: { temperature, maxOutputTokens, ...(json ? { responseMimeType: "application/json" } : {}) },
      },
      onDeviceParams: {
        createOptions: {
          expectedInputs: [{ type: "text", languages: ["en"] }],
          expectedOutputs: [{ type: "text", languages: ["en"] }],
          initialPrompts: [{ role: "system", content: [{ type: "text", value: system }] }],
        },
      },
    })
    models.set(key, model)
    // The on-device model may only be prepared after a user gesture; until it is ready the SDK serves the request from the cloud.
    if (isUserActive) void model.initializeDeviceModel().catch(() => {})
  }
  return model
}

export async function* streamCompletion({ system, user, temperature, maxCompletionTokens, signal, task = "structured" }: CompletionRequest) {
  const model = modelFor(task, system, temperature, maxCompletionTokens, false)
  try {
    const result = await model.generateContentStream(user, { signal })
    // The SDK settles `response` on its own schedule; a cancelled stream must not leave it rejected and unobserved.
    const response = result.response.catch(() => undefined)
    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) yield text
    }
    const final = await response
    if (final) recordInference(String(final.inferenceSource).toLowerCase().includes("device") ? "on-device" : "cloud")
  } catch (error) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError")
    throw error
  }
}

/**
 * Rates the questions the original decisions API answered: asks the model for JSON.
 * Scores are the 0-based index of the level that applies; yes/no questions are a probability from 0 to 1.
 */
export async function createDecisions(_apiKey: string, { input, questions }: DecisionRequest, signal: AbortSignal): Promise<DecisionResponse> {
  const text = typeof input === "string" ? input : input.map((block) => (block.type === "text" ? block.text : "")).join("\n")
  const system = `You rate text. Answer every question and reply with one JSON object that maps each question id to its answer, and nothing else.
- A "score" question lists numbered levels (0 is the lowest). Answer with the integer number of the level that fits best.
- A "yesno" question: answer with a number from 0 to 1, the probability that the answer is yes.`
  const user = `${text}\n\nQUESTIONS\n${Object.entries(questions)
    .map(([id, question]) => describe(id, question))
    .join("\n")}`

  const model = modelFor("structured", system, 0, 600, true)
  let result
  try {
    result = await model.generateContent(user, { signal })
  } catch (error) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError")
    throw error
  }
  const response = result.response
  recordInference(String(response.inferenceSource).toLowerCase().includes("device") ? "on-device" : "cloud")
  const parsed = parseJson(response.text())

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
  return { answers, usage: { total_input_tokens: 0, input_tokens_by_modality: [], total_output_tokens: 0, total_tokens: 0 } }
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