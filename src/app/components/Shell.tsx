import { useState } from "react"
import { Outlet } from "react-router-dom"
import { NewProjectDialog } from "./NewProjectDialog.tsx"
import { Sidebar } from "./Sidebar.tsx"

export function Shell() {
  const [creating, setCreating] = useState(false)
  return (
    <div className="shell">
      <Sidebar onNewProject={() => setCreating(true)} />
      <main className="main">
        <Outlet context={{ newProject: () => setCreating(true) }} />
      </main>
      {creating && <NewProjectDialog onClose={() => setCreating(false)} />}
    </div>
  )
}