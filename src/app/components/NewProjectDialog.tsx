import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../auth.tsx"
import { createProject, KINDS, type Kind } from "../store.ts"

export function NewProjectDialog({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [kind, setKind] = useState<Kind>("fiction")
  const [busy, setBusy] = useState(false)

  async function create() {
    if (!user || busy) return
    setBusy(true)
    const { pid, did } = await createProject(user.uid, title, kind)
    onClose()
    navigate(`/p/${pid}/d/${did}`)
  }

  return (
    <div className="scrim" onMouseDown={onClose}>
      <form className="dialog" onMouseDown={(e) => e.stopPropagation()} onSubmit={(e) => (e.preventDefault(), create())}>
        <h2>New project</h2>
        <label className="field">
          <span>Name</span>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The lighthouse novel" maxLength={80} />
        </label>
        <div className="field">
          <span>What are you writing?</span>
          <div className="kinds">
            {KINDS.map((k) => (
              <button type="button" key={k.kind} className="kind" aria-pressed={kind === k.kind} onClick={() => setKind(k.kind)}>
                <b>{k.label}</b>
                <small>{k.hint}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary" disabled={busy}>Create</button>
        </div>
      </form>
    </div>
  )
}