import { useEffect, useState } from "react"
import { NavLink, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../auth.tsx"
import { createDoc, useDocs, useProjects, type Project } from "../store.ts"

function ProjectRow({ project, uid }: { project: Project; uid: string }) {
  const params = useParams()
  const navigate = useNavigate()
  const [open, setOpen] = useState(params.pid === project.id)
  const docs = useDocs(open ? uid : undefined, project.id)
  useEffect(() => {
    if (params.pid === project.id) setOpen(true)
  }, [params.pid, project.id])

  return (
    <div className="tree-project">
      <div className="tree-row">
        <button className="chev" aria-label={open ? "Collapse" : "Expand"} onClick={() => setOpen(!open)} data-open={open}>▸</button>
        <NavLink to={`/p/${project.id}`} end className="tree-link">{project.title}</NavLink>
        <button className="mini" title="New page" aria-label="New page" onClick={async () => navigate(`/p/${project.id}/d/${await createDoc(uid, project.id)}`)}>+</button>
      </div>
      {open && (
        <div className="tree-docs">
          {docs === undefined && <div className="tree-empty">Loading…</div>}
          {docs?.length === 0 && <div className="tree-empty">No pages</div>}
          {docs?.map((d) => (
            <NavLink key={d.id} to={`/p/${project.id}/d/${d.id}`} className="tree-link leaf">{d.title || "Untitled"}</NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ onNewProject }: { onNewProject: () => void }) {
  const { user, signOut } = useAuth()
  const projects = useProjects(user?.uid)
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    addEventListener("online", on)
    addEventListener("offline", off)
    return () => (removeEventListener("online", on), removeEventListener("offline", off))
  }, [])

  return (
    <aside className="sidebar">
      <div className="side-top">
        <NavLink to="/" className="brand"><img src="/art/logo.svg" alt="atelier" /></NavLink>
      </div>
      <nav className="side-nav">
        <NavLink to="/" end className="nav-item"><span aria-hidden>⌂</span>Home</NavLink>
      </nav>
      <div className="side-section">
        <span>Projects</span>
        <button className="mini" title="New project" aria-label="New project" onClick={onNewProject}>+</button>
      </div>
      <div className="tree">
        {projects === undefined && <div className="tree-empty">Loading…</div>}
        {projects?.length === 0 && <button className="tree-empty link" onClick={onNewProject}>Create your first project</button>}
        {user && projects?.map((project) => <ProjectRow key={project.id} project={project} uid={user.uid} />)}
      </div>
      <div className="side-bottom">
        <div className="who" title={user?.email ?? "Guest"}>
          <span className="avatar">{(user?.email?.[0] ?? "G").toUpperCase()}</span>
          <span className="who-name">{user?.isAnonymous ? "Guest" : user?.email}</span>
        </div>
        <div className="side-status">
          <span className="dot" data-online={online} />
          {online ? "Synced" : "Offline: changes save here and sync later"}
        </div>
        <button className="nav-item" onClick={() => signOut()}>Sign out</button>
      </div>
    </aside>
  )
}