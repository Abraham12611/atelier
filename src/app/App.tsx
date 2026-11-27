import { Navigate, Outlet, Route, Routes } from "react-router-dom"
import { useAuth } from "./auth.tsx"
import { Shell } from "./components/Shell.tsx"
import { EditorPage } from "./pages/EditorPage.tsx"
import { HomePage } from "./pages/HomePage.tsx"
import { LoginPage } from "./pages/LoginPage.tsx"
import { ProjectPage } from "./pages/ProjectPage.tsx"

function Protected() {
  const { user, loading } = useAuth()
  if (loading) return <div className="splash"><img src="/art/spark.svg" alt="" /></div>
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Protected />}>
        <Route element={<Shell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/p/:pid" element={<ProjectPage />} />
          <Route path="/p/:pid/d/:did" element={<EditorPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}