import { useEffect } from "react"

/** The ball, over the page: the original Flow engine in an iframe, seeded with the writer's text and project. Keep hands the words they revealed back. */
export function FlowOverlay({ idea, text, onKeep, onClose }: { idea: string; text: string; onKeep: (text: string) => void; onClose: () => void }) {
  const seed = encodeURIComponent(JSON.stringify({ idea, text }))
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.origin !== location.origin) return
      if (event.data?.type === "atelier:keep") onKeep(String(event.data.text ?? ""))
      if (event.data?.type === "atelier:close") onClose()
    }
    addEventListener("message", listener)
    return () => removeEventListener("message", listener)
  }, [onKeep, onClose])
  return (
    <div className="flow-overlay" role="dialog" aria-label="Flow mode">
      <iframe title="Flow" src={`/flow.html?embed=1#${seed}`} allow="clipboard-write" />
    </div>
  )
}