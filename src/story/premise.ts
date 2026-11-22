/** What the writer asked for when they lit the spark: the idea and any chosen ingredients. Empty until the story begins. */
export type Premise = { idea: string; ingredients: string[] }

let current: Premise | undefined

export const setPremise = (premise: Premise | undefined) => void (current = premise)
export const getPremise = () => current

/** One block of the writer's wishes for the model's user message. */
export function premiseBlock({ idea, ingredients }: Premise) {
  return [idea.trim(), ingredients.length ? `Ingredients: ${ingredients.join(", ")}` : ""].filter(Boolean).join("\n")
}
