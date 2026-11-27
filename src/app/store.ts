import { addDoc, collection, collectionGroup, doc, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where, type Timestamp } from "firebase/firestore"
import { useEffect, useState } from "react"
import { db } from "../firebase/app.ts"

export type Kind = "fiction" | "blog" | "copy" | "essay"
export const KINDS: { kind: Kind; label: string; hint: string }[] = [
  { kind: "fiction", label: "Fiction", hint: "Stories, novels, scripts" },
  { kind: "blog", label: "Blog & newsletter", hint: "Posts with a voice" },
  { kind: "copy", label: "Copywriting", hint: "Ads, pages, product copy" },
  { kind: "essay", label: "Essay & non-fiction", hint: "Arguments and explainers" },
]

export type Project = { id: string; title: string; kind: Kind; description: string; trashed: boolean; updatedAt?: Timestamp }
export type Doc = { id: string; pid: string; title: string; html: string; text: string; words: number; trashed: boolean; updatedAt?: Timestamp }

const projectsPath = (uid: string) => collection(db, "users", uid, "projects")
const docsPath = (uid: string, pid: string) => collection(db, "users", uid, "projects", pid, "docs")

export const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length

export async function createProject(uid: string, title: string, kind: Kind) {
  const project = await addDoc(projectsPath(uid), { title: title.trim() || "Untitled project", kind, description: "", trashed: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  const first = await createDoc(uid, project.id, "Untitled")
  return { pid: project.id, did: first }
}

export async function createDoc(uid: string, pid: string, title = "Untitled") {
  const ref = await addDoc(docsPath(uid, pid), { ownerUid: uid, pid, title, html: "", text: "", words: 0, trashed: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  return ref.id
}

export const saveDoc = (uid: string, pid: string, did: string, fields: Partial<Pick<Doc, "title" | "html" | "text" | "words" | "trashed">>) =>
  updateDoc(doc(db, "users", uid, "projects", pid, "docs", did), { ...fields, updatedAt: serverTimestamp() })

export const saveProject = (uid: string, pid: string, fields: Partial<Pick<Project, "title" | "kind" | "description" | "trashed">>) =>
  updateDoc(doc(db, "users", uid, "projects", pid), { ...fields, updatedAt: serverTimestamp() })

function useQuerySnapshot<T>(make: (() => ReturnType<typeof query>) | undefined, deps: unknown[], map: (id: string, data: any) => T) {
  const [items, setItems] = useState<T[] | undefined>(undefined)
  useEffect(() => {
    if (!make) return setItems(undefined)
    return onSnapshot(make(), (snapshot) => setItems(snapshot.docs.map((d) => map(d.id, d.data({ serverTimestamps: "estimate" })))), (error) => console.error(error))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return items
}

export function useProjects(uid?: string) {
  const items = useQuerySnapshot<Project>(uid ? () => query(projectsPath(uid), orderBy("updatedAt", "desc")) : undefined, [uid], (id, d) => ({ id, ...d }))
  return items?.filter((project) => !project.trashed)
}

export function useDocs(uid?: string, pid?: string) {
  const items = useQuerySnapshot<Doc>(uid && pid ? () => query(docsPath(uid, pid), orderBy("updatedAt", "desc")) : undefined, [uid, pid], (id, d) => ({ id, ...d }))
  return items?.filter((d) => !d.trashed)
}

/** The writer's most recently edited documents across every project. */
export function useRecentDocs(uid?: string) {
  const items = useQuerySnapshot<Doc>(
    uid ? () => query(collectionGroup(db, "docs"), where("ownerUid", "==", uid), orderBy("updatedAt", "desc"), limit(12)) : undefined,
    [uid],
    (id, d) => ({ id, ...d }),
  )
  return items?.filter((d) => !d.trashed)
}

export function useOne<T>(path: string[] | undefined, map: (id: string, data: any) => T) {
  const [item, setItem] = useState<T | null | undefined>(undefined)
  const key = path?.join("/")
  useEffect(() => {
    if (!path) return setItem(undefined)
    return onSnapshot(doc(db, path[0], ...path.slice(1)), (snapshot) => setItem(snapshot.exists() ? map(snapshot.id, snapshot.data({ serverTimestamps: "estimate" })) : null), (error) => console.error(error))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return item
}