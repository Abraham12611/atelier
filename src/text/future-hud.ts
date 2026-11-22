import type { Point } from "../point.ts"
import { optionIndexAt, type Dimension } from "./dimension.ts"
import { pathOf } from "./links.ts"
import { dimensionStyle, iconUrl, OPTION_COLORS } from "./palette.ts"

/** The wheel is a half circle: a knob swings this far either side of the axis. */
export const SWING_RADIANS = Math.PI / 2
export const STRENGTH_RANGE_PX = 200
/** A scale's rim is graduated in this many steps, every `NUMBERED_EVERY`th one longer. */
export const GRADUATIONS = 40
export const NUMBERED_EVERY = 10
/** The link to the tuned knob is a ruler marked in this many steps of strength, every `RULER_MAJOR_EVERY`th one longer. */
export const RULER_STEPS = 10
const RULER_MAJOR_EVERY = 5
const RULER_MARK_PX = 3

/** Choosing: the radial menu's ring, from where the dead zone ends to the gate that picks. */
const WHEEL_DEPTH_PX = 72
const WHEEL_GAP_RADIANS = 0.03
const ICON_PX = 38
const ICON_ACTIVE_PX = 48
/** Tuning: the sub-menu is a thinner ring on the rim, with its own labels outside. */
const TRACK_DEPTH_PX = 30
const LABEL_GAP_PX = 14
/** Must match the line height of `#future-hud text` in the page styles. */
const LABEL_LINE_HEIGHT_PX = 20
const LABEL_PADDING_PX = 8
const CENTERED_RADIANS = Math.PI / 18
const MAX_ARC_RADIANS = Math.PI / 3
const SVG_NS = "http://www.w3.org/2000/svg"
const STRENGTH_NAMES = ["slight", "moderate", "strong"]

let context: CanvasRenderingContext2D | undefined

type HudView =
  /** Tier 1: the radial menu of dimension names, none while it loads; `progress` is how far the knob has travelled to the gate. */
  | { phase: "choosing"; names: string[]; candidate?: number; progress: number }
  /** Tier 2: `swing` is the knob's angle from the axis, clamped to the fan. */
  | { phase: "tuning"; dimension: Dimension; swing: number }

/** One run of the readout: `dim` for context such as the dimension's name, `live` for the value the pointer is changing right now. */
export type ReadoutPart = { text: string; tone?: "dim" | "live" }

type HudOptions = {
  center: Point
  /** While tuning, where strength reaches 100%; while choosing, the gate that chooses the candidate carried through it. */
  rimRadius: number
  /** The fan's direction as an angle of deviation from straight down. */
  axis: number
  view: HudView
  /** The active knob's state, written beyond the wheel. */
  readout: ReadoutPart[]
  /** The active knob, unclamped: its angle from the axis, distance from `center` and radius. While tuning, its link is marked as a ruler of strength. */
  knob: { swing: number; distance: number; radius: number }
}

/**
 * The steering wheel, as SVG nodes. Choosing shows a half-ring radial menu: one coloured wedge per dimension with its illustration, the one in the knob's direction lit and filling as the knob nears the gate.
 * Tuning shows that dimension's sub-menu: a ring on the rim, segmented for a choice or a filling track for a scale, over faint arcs marking strength.
 */
export function hudNodesOf({ center, rimRadius, axis, view, readout, knob }: HudOptions): SVGElement[] {
  const onFan = (swing: number, radius = rimRadius): Point => ({
    x: center.x + Math.sin(axis + swing) * radius,
    y: center.y + Math.cos(axis + swing) * radius,
  })
  const tint = (node: SVGElement, color: string) => (node.setAttribute("style", `--c:${color}`), node)
  const ring = (inner: number, outer: number, from: number, to: number, role: string, color?: string) => {
    const node = marked(role, bandPath(onFan, inner, outer, from, to))
    return color ? tint(node, color) : node
  }
  const textAt = (swing: number, radius: number, content: string, isLabel: boolean) => {
    const { x, y } = onFan(swing, radius)
    const across = Math.sin(axis + swing)
    const isCentered = Math.abs(across) < Math.sin(CENTERED_RADIANS)
    const anchor = isCentered ? "middle" : across < 0 ? "end" : "start"
    const baseline = isCentered && isLabel ? (Math.cos(axis + swing) > 0 ? "hanging" : "text-after-edge") : "middle"
    const text = svg("text", { x, y, "text-anchor": anchor, "dominant-baseline": baseline })
    text.textContent = content
    return { text, x, y, anchor, baseline }
  }
  /** A label outside the ring; a selected one sits on a coloured pill, measured here since the nodes are not on the page yet. */
  const labelAt = (swing: number, radius: number, content: string, color: string, isSelected = false): SVGElement[] => {
    const { text, x, y, anchor, baseline } = textAt(swing, radius + LABEL_GAP_PX, content, true)
    if (!isSelected) return [text]
    text.dataset.selected = ""
    const width = widthOf(content) + 2 * LABEL_PADDING_PX
    const height = LABEL_LINE_HEIGHT_PX
    const left = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width + LABEL_PADDING_PX : x - LABEL_PADDING_PX
    const top = baseline === "hanging" ? y - 3 : baseline === "text-after-edge" ? y - height + 3 : y - height / 2
    const plate = tint(svg("rect", { x: left, y: top, width, height, rx: height / 2 }), color)
    plate.dataset.plate = ""
    return [plate, tint(text, color)]
  }
  const iconAt = (swing: number, radius: number, name: string, size: number, isActive: boolean) => {
    const { x, y } = onFan(swing, radius)
    const icon = svg("image", { href: iconUrl(name), x: x - size / 2, y: y - size / 2, width: size, height: size })
    icon.dataset.role = "icon"
    if (isActive) icon.dataset.active = ""
    return icon
  }
  const readoutAt = (labels: string[], outer: number) => {
    const depth = LABEL_LINE_HEIGHT_PX * Math.abs(Math.cos(axis)) + (Math.max(0, ...labels.map(widthOf)) + LABEL_GAP_PX) * Math.abs(Math.sin(axis))
    const { text } = textAt(0, outer + LABEL_GAP_PX + depth + LABEL_GAP_PX, "", false)
    text.dataset.readout = ""
    text.replaceChildren(...readout.map(readoutSpan))
    return text
  }

  if (view.phase === "choosing") {
    const { names, candidate, progress } = view
    const inner = rimRadius - WHEEL_DEPTH_PX
    const bed = ring(inner - 8, rimRadius + 8, -SWING_RADIANS - 0.02, SWING_RADIANS + 0.02, "wheel-bed")
    if (!names.length) {
      const placeholders = Array.from({ length: 5 }, (_, i) => {
        const [from, to] = sectorOf(5, i)
        return ring(inner, rimRadius, from, to, "wedge")
      })
      placeholders.forEach((node) => (node.dataset.loading = ""))
      return [bed, ...placeholders, readoutAt(["loading"], rimRadius)]
    }
    const middle = inner + WHEEL_DEPTH_PX / 2
    const nodes: SVGElement[] = [bed]
    const labels: SVGElement[] = []
    names.forEach((name, i) => {
      const [from, to] = sectorOf(names.length, i)
      const { color } = dimensionStyle(name)
      const isActive = i === candidate
      const wedge = ring(inner, rimRadius, from, to, "wedge", color)
      if (isActive) wedge.dataset.active = ""
      nodes.push(wedge)
      if (isActive) nodes.push(ring(inner, inner + Math.max(0.06, progress) * WHEEL_DEPTH_PX, from, to, "wedge-fill", color))
      nodes.push(iconAt((from + to) / 2, middle, name, isActive ? ICON_ACTIVE_PX : ICON_PX, isActive))
      labels.push(...labelAt((from + to) / 2, rimRadius, name, color, isActive))
    })
    return [...nodes, ...labels, readoutAt(names, rimRadius)]
  }

  const { dimension, swing } = view
  const { color } = dimensionStyle(dimension.name)
  const zero = rimRadius - STRENGTH_RANGE_PX
  const rings = [1 / 3, 2 / 3, 1].flatMap((strength, i) => {
    const radius = zero + strength * STRENGTH_RANGE_PX
    const arc = marked("ring", bandPath(onFan, radius, radius, -SWING_RADIANS, SWING_RADIANS))
    const { text } = textAt(-SWING_RADIANS - CENTERED_RADIANS, radius, STRENGTH_NAMES[i], false)
    text.setAttribute("text-anchor", "end")
    text.dataset.numeral = ""
    return i === 2 ? [arc] : [arc, text]
  })
  const inner = rimRadius - TRACK_DEPTH_PX
  const bed = ring(zero, rimRadius + 8, -SWING_RADIANS - 0.02, SWING_RADIANS + 0.02, "wheel-bed")
  const ruler = rulerOf(center, axis, rimRadius, knob)

  if (dimension.kind === "scale") {
    const track = ring(inner, rimRadius, -SWING_RADIANS, SWING_RADIANS, "track", color)
    const fill = ring(inner, rimRadius, -SWING_RADIANS, Math.max(-SWING_RADIANS + 0.02, swing), "track-fill", color)
    const graduations = Array.from({ length: GRADUATIONS + 1 }, (_, i) => -SWING_RADIANS + (i / GRADUATIONS) * 2 * SWING_RADIANS)
    const minor = marked("minor", pathOf(graduations.filter((_, i) => i % NUMBERED_EVERY).map((at) => [onFan(at, inner + 4), onFan(at, inner + 9)] as [Point, Point])))
    const major = marked("boundary", pathOf(graduations.filter((_, i) => i % NUMBERED_EVERY === 0).map((at) => [onFan(at, inner + 3), onFan(at, rimRadius - 3)] as [Point, Point])))
    const thumb = onFan(swing, rimRadius - TRACK_DEPTH_PX / 2)
    const marker = tint(svg("circle", { cx: thumb.x, cy: thumb.y, r: 13 }), color)
    marker.dataset.role = "thumb"
    const glyph = iconAt(swing, rimRadius - TRACK_DEPTH_PX / 2, dimension.name, 22, false)
    return [
      bed,
      ...rings,
      ruler,
      track,
      fill,
      minor,
      major,
      marker,
      glyph,
      readoutAt([dimension.low, dimension.high], rimRadius),
      ...labelAt(-SWING_RADIANS, rimRadius, dimension.low, color, swing < -SWING_RADIANS * 0.55),
      ...labelAt(SWING_RADIANS, rimRadius, dimension.high, color, swing > SWING_RADIANS * 0.55),
    ]
  }

  const { options } = dimension
  const selected = optionIndexAt(options.length, (swing + SWING_RADIANS) / (2 * SWING_RADIANS))
  const nodes: SVGElement[] = [bed, ...rings, ruler]
  const labels: SVGElement[] = []
  options.forEach((option, i) => {
    const [from, to] = sectorOf(options.length, i)
    const optionColor = OPTION_COLORS[i % OPTION_COLORS.length]
    const segment = ring(inner, rimRadius, from, to, "segment", optionColor)
    if (i === selected) segment.dataset.selected = ""
    nodes.push(segment)
    labels.push(...labelAt((from + to) / 2, rimRadius, option, optionColor, i === selected))
  })
  nodes.push(iconAt(sectorOf(options.length, selected).reduce((a, b) => (a + b) / 2), inner + TRACK_DEPTH_PX / 2, dimension.name, 24, false))
  return [...nodes, ...labels, readoutAt(options, rimRadius)]
}

/** Marks across the link to the knob, one per `1 / RULER_STEPS` of strength it has passed: each where the knob's edge would be at that strength. */
function rulerOf(center: Point, axis: number, rimRadius: number, knob: HudOptions["knob"]) {
  const zero = rimRadius - STRENGTH_RANGE_PX
  const direction = axis + knob.swing
  const across = direction + Math.PI / 2
  const along = (radius: number): Point => ({ x: center.x + Math.sin(direction) * radius, y: center.y + Math.cos(direction) * radius })
  const offset = ({ x, y }: Point, length: number): Point => ({ x: x + Math.sin(across) * length, y: y + Math.cos(across) * length })
  const marks = Array.from({ length: RULER_STEPS }, (_, i) => i + 1).flatMap((step) => {
    const reach = zero + (step / RULER_STEPS) * STRENGTH_RANGE_PX
    if (reach > knob.distance) return []
    const at = along(reach - knob.radius)
    const length = step % RULER_MAJOR_EVERY ? RULER_MARK_PX : RULER_MARK_PX * 2
    return [[offset(at, length), offset(at, -length)] as [Point, Point]]
  })
  return marked("ruler", pathOf(marks))
}

/** The `i`th of `count` equal sectors of the fan, as a pair of swings, with a small gap kept between neighbours. */
function sectorOf(count: number, i: number): [number, number] {
  const size = (2 * SWING_RADIANS) / count
  return [-SWING_RADIANS + size * i + WHEEL_GAP_RADIANS / 2, -SWING_RADIANS + size * (i + 1) - WHEEL_GAP_RADIANS / 2]
}

/** Measured in the font the HUD's text is drawn in: the page's family at `--hud-size`. */
function widthOf(content: string) {
  const style = getComputedStyle(document.documentElement)
  context ??= document.createElement("canvas").getContext("2d")!
  context.font = `700 ${style.getPropertyValue("--hud-size")} ${style.fontFamily}`
  return context.measureText(content).width
}

function readoutSpan({ text, tone }: ReadoutPart, index: number) {
  const span = svg("tspan", {})
  span.textContent = index ? ` ${text}` : text
  if (tone) span.dataset.tone = tone
  return span
}

function marked(role: string, d: string) {
  const path = svg("path", { d })
  path.dataset.role = role
  return path
}

function svg(tag: string, attributes: Record<string, string | number>) {
  const element = document.createElementNS(SVG_NS, tag) as SVGElement
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, `${value}`)
  return element
}

/** The band between radii `inner` and `outer`, from swing `from` to `to`, drawn as arcs of at most `MAX_ARC_RADIANS` so any span is unambiguous. A zero-depth band is a plain arc. */
function bandPath(onFan: (swing: number, radius: number) => Point, inner: number, outer: number, from: number, to: number) {
  const pieces = Math.max(1, Math.ceil((to - from) / MAX_ARC_RADIANS))
  const swings = Array.from({ length: pieces + 1 }, (_, i) => from + ((to - from) * i) / pieces)
  const start = onFan(swings[0], outer)
  let d = `M${start.x},${start.y}`
  for (const swing of swings.slice(1)) {
    const point = onFan(swing, outer)
    d += `A${outer},${outer} 0 0 0 ${point.x},${point.y}`
  }
  if (inner === outer) return d
  const edge = onFan(to, inner)
  d += `L${edge.x},${edge.y}`
  for (const swing of swings.slice(0, -1).reverse()) {
    const point = onFan(swing, inner)
    d += `A${inner},${inner} 0 0 1 ${point.x},${point.y}`
  }
  return `${d}Z`
}
