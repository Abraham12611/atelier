import { useNavigate, useOutletContext } from "react-router-dom"
import { Link } from "react-router-dom"
import { useAuth } from "../auth.tsx"
import { KINDS, useProjects, useRecentDocs } from "../store.ts"

const greeting = () => {
  const hour = new Date().getHours()
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
}

export function HomePage() {
  const { user } = useAuth()
  const { newProject } = useOutletContext<{ newProject: () => void }>()
  const projects = useProjects(user?.uid)
  const recent = useRecentDocs(user?.uid)
  const navigate = useNavigate()
  const titleOf = (pid: string) => projects?.find((p) => p.id === pid)?.title ?? ""
  const kindLabel = (kind: string) => KINDS.find((k) => k.kind === kind)?.label ?? kind

  if (projects && projects.length === 0)
    return (
      <div className="page center">
        <img className="empty-art" src="/art/mascot.png" alt="" />
        <h1>{greeting()}. What are we writing?</h1>
        <p className="muted">Start a project, then drag the ball to draft it as fast as you can steer.</p>
        <button className="btn primary" onClick={newProject}>Start your first project</button>
      </div>
    )

  return (
    <div className="page">
      <h1>{greeting()}</h1>
      <section>
        <h3 className="section">Pick up where you left off</h3>
        <div className="cards">
          {recent === undefined && <div className="muted">Loading…</div>}
          {recent?.length === 0 && <div className="muted">Nothing yet. Open a project to begin.</div>}
          {recent?.slice(0, 6).map((d) => (
            <button key={d.id} className="card" onClick={() => navigate(`/p/${d.pid}/d/${d.id}`)}>
              <b>{d.title || "Untitled"}</b>
              <span className="muted small">{titleOf(d.pid)}</span>
              <span className="card-meta">{d.words} {d.words === 1 ? "word" : "words"}</span>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3 className="section">Projects</h3>
        <div className="cards">
          {projects?.map((p) => (
            <Link key={p.id} to={`/p/${p.id}`} className="card">
              <b>{p.title}</b>
              <span className="chip">{kindLabel(p.kind)}</span>
            </Link>
          ))}
          <button className="card ghost" onClick={newProject}>+ New project</button>
        </div>
      </section>
    </div>
  )
}