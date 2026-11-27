import Placeholder from "@tiptap/extension-placeholder"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../auth.tsx"
import { countWords, saveDoc, useOne, type Doc, type Project } from "../store.ts"

type SaveState = "saved" | "saving" | "offline"

export function EditorPage() {
  const { pid, did } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const uid = user?.uid
  const project = useOne<Project>(uid && pid ? ["users", uid, "projects", pid] : undefined, (id, d) => ({ id, ...d }))
  const doc = useOne<Doc>(uid && pid && did ? ["users", uid, "projects", pid, "docs", did] : undefined, (id, d) => ({ id, ...d }))
  const [title, setTitle] = useState("")
  const [words, setWords] = useState(0)
  const [state, setState] = useState<SaveState>("saved")
  const loaded = useRef<string | undefined>(undefined)
  const timer = useRef<number | undefined>(undefined)

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Start writing. Markdown shortcuts work: # for a heading, - for a list, > for a quote." })],
    content: "",
    editorProps: { attributes: { class: "prose", spellcheck: "true" } },
    onUpdate: ({ editor }) => {
      setWords(countWords(editor.getText()))
      schedule({ html: editor.getHTML(), text: editor.getText(), words: countWords(editor.getText()) })
    },
  })

  const pending = useRef<Partial<Doc>>({})
  function schedule(fields: Partial<Doc>) {
    pending.current = { ...pending.current, ...fields }
    setState(navigator.onLine ? "saving" : "offline")
    clearTimeout(timer.current)
    timer.current = window.setTimeout(flush, 700)
  }
  function flush() {
    if (!uid || !pid || !did || !Object.keys(pending.current).length) return
    const fields = pending.current
    pending.current = {}
    saveDoc(uid, pid, did, fields).then(() => setState(navigator.onLine ? "saved" : "offline"), () => setState("offline"))
    // With offline persistence the write is queued locally; the promise settles when the server confirms.
    if (!navigator.onLine) setState("offline")
  }

  useEffect(() => () => (clearTimeout(timer.current), flush()), [did]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load the document once per page; later snapshots (our own saves) must not overwrite what is being typed.
  useEffect(() => {
    if (!doc || !editor || loaded.current === doc.id) return
    loaded.current = doc.id
    setTitle(doc.title)
    setWords(doc.words)
    editor.commands.setContent(doc.html || "", { emitUpdate: false })
    if (!doc.html) editor.commands.focus("end")
  }, [doc, editor])

  if (doc === null) return <div className="page center"><h2>This page was not found</h2><Link to="/" className="btn">Back home</Link></div>

  return (
    <div className="editor-wrap">
      <header className="topbar">
        <nav className="crumbs">
          <Link to={`/p/${pid}`}>{project?.title ?? "…"}</Link>
          <span>/</span>
          <span>{title || "Untitled"}</span>
        </nav>
        <div className="topbar-right">
          <span className="muted small">{words.toLocaleString()} {words === 1 ? "word" : "words"}</span>
          <span className="save" data-state={state}>{state === "saved" ? "Saved" : state === "saving" ? "Saving…" : "Offline: saved on this device"}</span>
          <button className="btn small" onClick={() => saveDoc(uid!, pid!, did!, { trashed: true }).then(() => navigate(`/p/${pid}`))}>Delete page</button>
        </div>
      </header>
      <div className="doc">
        <input
          className="doc-title"
          value={title}
          onChange={(e) => (setTitle(e.target.value), schedule({ title: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), editor?.commands.focus("start"))}
          placeholder="Untitled"
          aria-label="Page title"
        />
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}