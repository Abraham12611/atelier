import { useState } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../auth.tsx"

export function LoginPage() {
  const { user, loading, signIn, signUp, tryAnonymously } = useAuth()
  const [mode, setMode] = useState<"in" | "up">("in")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  if (!loading && user) return <Navigate to="/" replace />

  async function submit(action: () => Promise<unknown>) {
    setBusy(true)
    setError("")
    try {
      await action()
    } catch (e) {
      const code = (e as { code?: string }).code ?? ""
      setError(
        code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")
          ? "That email and password do not match."
          : code.includes("email-already-in-use")
            ? "An account with that email already exists."
            : code.includes("weak-password")
              ? "Use at least 6 characters."
              : "Something went wrong. Try again.",
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <div className="login-card">
        <img className="login-logo" src="/art/logo.svg" alt="atelier" />
        <h1>{mode === "in" ? "Welcome back" : "Create your account"}</h1>
        <p className="muted">A writing workspace where you steer the draft.</p>
        <form onSubmit={(e) => (e.preventDefault(), submit(() => (mode === "in" ? signIn(email, password) : signUp(email, password))))}>
          <label className="field">
            <span>Email</span>
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" required minLength={6} autoComplete={mode === "in" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <div className="error" role="alert">{error}</div>}
          <button className="btn primary wide" disabled={busy}>{mode === "in" ? "Continue" : "Create account"}</button>
        </form>
        <div className="divider"><span>or</span></div>
        <button className="btn wide" disabled={busy} onClick={() => submit(tryAnonymously)}>Try it without an account</button>
        <p className="muted small">
          {mode === "in" ? "New here? " : "Already have an account? "}
          <button className="link" onClick={() => (setMode(mode === "in" ? "up" : "in"), setError(""))}>{mode === "in" ? "Create an account" : "Sign in"}</button>
        </p>
      </div>
    </div>
  )
}