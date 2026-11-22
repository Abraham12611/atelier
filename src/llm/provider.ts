/**
 * The one place that decides which text backend the app talks to.
 * Currently the temporary OpenRouter proxy; the Cerebras integration swaps these exports to `./cerebras.ts` and `./decisions.ts`.
 */
export { createDecisions, storedApiKey, storedGeminiKey, streamCompletion } from "./openrouter.ts"
export type { Question } from "./decisions.ts"
