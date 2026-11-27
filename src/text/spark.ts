import { STORY_INGREDIENTS, STORY_SPARKS } from "../story/openings.ts"
import type { Premise } from "../story/premise.ts"
import { $ } from "../dom.ts"

const MAX_INGREDIENTS = 3

/**
 * The way a story starts: before any word exists, the writer lights a spark, an idea in their own words plus up to three ingredients.
 * Resolves once they begin; the portal then lifts away to reveal the canvas.
 */
export function lightTheSpark({ idea: suggested, auto = false }: { idea?: string; auto?: boolean } = {}): Promise<Premise> {
  const portal = $("#spark")
  const idea = $<HTMLTextAreaElement>("#spark-idea")
  const chips = $("#spark-chips")
  const go = $<HTMLButtonElement>("#spark-go")
  const surprise = $<HTMLButtonElement>("#spark-surprise")
  const picked = new Set<string>()
  if (suggested) idea.value = suggested
  if (auto) {
    portal.setAttribute("hidden", "")
    document.body.dataset.stage = "writing"
    return Promise.resolve({ idea: suggested?.trim() || "Continue the story", ingredients: [] })
  }

  chips.replaceChildren(
    ...STORY_INGREDIENTS.map(({ label, emoji }) => {
      const chip = Object.assign(document.createElement("button"), { type: "button", className: "chip" })
      chip.dataset.label = label
      chip.setAttribute("aria-pressed", "false")
      chip.innerHTML = `<span aria-hidden="true">${emoji}</span>${label}`
      chip.addEventListener("click", () => toggle(label))
      return chip
    }),
  )

  const refresh = () => {
    for (const chip of chips.querySelectorAll<HTMLElement>(".chip")) {
      const on = picked.has(chip.dataset.label!)
      chip.setAttribute("aria-pressed", `${on}`)
      chip.toggleAttribute("data-full", !on && picked.size >= MAX_INGREDIENTS)
    }
    go.disabled = idea.value.trim().length < 3 && picked.size === 0
  }
  const toggle = (label: string) => {
    if (picked.has(label)) picked.delete(label)
    else if (picked.size < MAX_INGREDIENTS) picked.add(label)
    refresh()
  }
  idea.addEventListener("input", refresh)
  surprise.addEventListener("click", () => {
    idea.value = STORY_SPARKS[Math.floor(Math.random() * STORY_SPARKS.length)]
    picked.clear()
    const pool = STORY_INGREDIENTS.map(({ label }) => label).sort(() => Math.random() - 0.5)
    pool.slice(0, 2).forEach((label) => picked.add(label))
    refresh()
    idea.focus()
  })

  refresh()
  document.body.dataset.stage = "spark"
  queueMicrotask(() => idea.focus())

  return new Promise((resolve) => {
    const begin = () => {
      if (go.disabled) return
      portal.setAttribute("data-leaving", "")
      document.body.dataset.stage = "writing"
      setTimeout(() => portal.setAttribute("hidden", ""), 700)
      resolve({ idea: idea.value.trim() || `A ${[...picked].join(", ").toLowerCase()} story`, ingredients: [...picked] })
    }
    go.addEventListener("click", begin)
    idea.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) begin()
    })
  })
}
