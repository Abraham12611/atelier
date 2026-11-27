/** Where each request ran, for the on-device / cloud chip. */
export type Source = "on-device" | "cloud"

type Listener = (stats: { onDevice: number; cloud: number; last?: Source }) => void

const stats = { onDevice: 0, cloud: 0, last: undefined as Source | undefined }
const listeners = new Set<Listener>()

export function recordInference(source: Source) {
  if (source === "on-device") stats.onDevice++
  else stats.cloud++
  stats.last = source
  for (const listener of listeners) listener({ ...stats })
}

export function onInference(listener: Listener) {
  listeners.add(listener)
  listener({ ...stats })
  return () => void listeners.delete(listener)
}