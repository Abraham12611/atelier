import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../auth.tsx"
import { createDoc, KINDS, saveProject, useDocs, useOne, type Project } from "../store.ts"

export function ProjectPage() {
  const { pid } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const uid = user?.uid
  const project = useOne<Project>(uid && pid ? ["users", uid, "projects", pid] : undefined, (id, d) => ({ id, ...d }))
  const docs = useDocs(uid, pid)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (project && !ready) {
      setTitle(project.title)
      setDescription(project.description)
      setReady(true)
    }
  }, [project, ready])
  useEffect(() => setReady(false), [pid])

  useEffect(() => {
    if (!ready || !uid || !pid) return
    const timer = setTimeout(() => saveProject(uid, pid, { title: title.trim() || "Untitled project", description }), 600)
    return () => clearTimeout(timer)
  }, [title, description, ready, uid, pid])

  if (project === null) return <div className="page center"><h2>Project not found</h2></div>
  if (!project || !uid || !pid) return <div className="page"><div className="muted">Loading…</div></div>

  const total = docs?.reduce((n, d) => n + d.words, 0) ?? 0
  return (
    <div className="page">
      <input className="title-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Untitled project" aria-label="Project name" />
      <div className="meta-row">
        <span className="chip">{KINDS.find((k) => k.kind === project.kind)?.label}</span>
        <span className="muted small">{total.toLocaleString()} words across {docs?.length ?? 0} pages</span>
      </div>
      <textarea className="desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project about? The AI reads this as context." aria-label="Project description" />
      <h3 className="section">Pages</h3>
      <div className="list">
        {docs?.map((d) => (
          <button key={d.id} className="list-row" onClick={() => navigate(`/p/${pid}/d/${d.id}`)}>
            <span>{d.title || "Untitled"}</span>
            <span className="muted small">{d.words} words</span>
          </button>
        ))}
        <button className="list-row ghost" onClick={async () => navigate(`/p/${pid}/d/${await createDoc(uid, pid)}`)}>+ New page</button>
      </div>
      <div className="danger-zone">
        <button className="btn" onClick={async () => (await saveProject(uid, pid, { trashed: true }), navigate("/"))}>Archive project</button>
      </div>
    </div>
  )
}