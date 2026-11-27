import { createUserWithEmailAndPassword, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut as firebaseSignOut, type User } from "firebase/auth"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { auth } from "../firebase/app.ts"

type AuthState = {
  user: User | null
  loading: boolean
  tryAnonymously: () => Promise<unknown>
  signIn: (email: string, password: string) => Promise<unknown>
  signUp: (email: string, password: string) => Promise<unknown>
  signOut: () => Promise<void>
}

const Context = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(
    () =>
      onAuthStateChanged(auth, (next) => {
        setUser(next)
        setLoading(false)
      }),
    [],
  )
  const value: AuthState = {
    user,
    loading,
    tryAnonymously: () => signInAnonymously(auth),
    signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
    signUp: (email, password) => createUserWithEmailAndPassword(auth, email, password),
    signOut: () => firebaseSignOut(auth),
  }
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useAuth() {
  const value = useContext(Context)
  if (!value) throw new Error("useAuth outside AuthProvider")
  return value
}