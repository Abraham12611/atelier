/** Each steering dimension's colour and its illustration in `public/art`. Unknown dimensions, which the model may invent, get the spark. */
const DIMENSIONS: Record<string, { color: string; icon: string }> = {
  tension: { color: "#ff4b4b", icon: "tension" },
  pace: { color: "#ff9600", icon: "pace" },
  tone: { color: "#ff86d0", icon: "tone" },
  focus: { color: "#1cb0f6", icon: "focus" },
  mode: { color: "#ce82ff", icon: "mode" },
  resolution: { color: "#58cc02", icon: "resolution" },
  distance: { color: "#00d6be", icon: "distance" },
  fortune: { color: "#ffc800", icon: "fortune" },
  surprise: { color: "#ff3cac", icon: "surprise" },
}
const FALLBACK = { color: "#89e219", icon: "spark" }

/** Colours for the options of a choice, in order. */
export const OPTION_COLORS = ["#1cb0f6", "#ff9600", "#ce82ff", "#58cc02", "#ff86d0"]

export const dimensionStyle = (name: string) => DIMENSIONS[name.toLowerCase()] ?? FALLBACK
export const iconUrl = (name: string) => `${import.meta.env.BASE_URL}art/${dimensionStyle(name).icon}.svg`
