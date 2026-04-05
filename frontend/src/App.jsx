import { Editor } from "@monaco-editor/react"
import { MonacoBinding } from "y-monaco"
import { useRef, useState, useEffect } from "react"
import * as Y from 'yjs'
import { SocketIOProvider } from "y-socket.io"
import { useMemo } from "react";
const App = () => {
  const [userName, setUserName] = useState(() => {
    return new URLSearchParams(window.location.search).get("username") || ""
  });
  const [nameInput, setNameInput] = useState(userName)
  const [users, setUsers] = useState([])
  const [isEditorReady, setIsEditorReady] = useState(false)
  const editorRef = useRef(null)
  // ydoc store the multipla file , that with the help of this ydoc 
  // yText compaire with the help of ydoc , Compaire ke bad jo dalta niklta hia
  // vo server pe jata hai fir us detla ko server fhir brodcast kr deta hai 
  const ydoc=useMemo(()=> new Y.Doc() ,[]) // this store all text from the frontend . 
  const yText= useMemo(()=> ydoc.getText("monaco"),[ydoc])

  const handleMount = (editor) => {
    editorRef.current = editor
    setIsEditorReady(true)
  }

  const handleJoin = (e) => {
    e.preventDefault();
    const trimmedName = nameInput.trim()
    if (!trimmedName) return
    setUserName(trimmedName)
    window.history.pushState({}, "", `?username=${encodeURIComponent(trimmedName)}`)
  }
  useEffect(() => {
    if (!userName || !isEditorReady || !editorRef.current) return

    const provider = new SocketIOProvider("/", "monaco", ydoc, { // why / because we are using same port for both frontend and backend
      autoConnect: true
    })

    provider.awareness.setLocalStateField("user", {
      name: userName,
      color: `hsl(${Math.floor(Math.random() * 360)}, 100%, 75%)`
    })

    const syncUsers = () => {
      const states = Array.from(provider.awareness.getStates().values())
      const activeUsers = states
        .map((state) => state.user)
        .filter((user) => user && user.name)
      setUsers(activeUsers)
    }

    provider.awareness.on("change", syncUsers)
    syncUsers()

    function handleBeforeUnload() {
      provider.awareness.setLocalStateField("user", null)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    const monacoBinding = new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      provider.awareness
    )

    return () => {
      provider.awareness.off?.("change", syncUsers)
      provider.awareness.setLocalStateField("user", null)
      provider.disconnect()
      monacoBinding.destroy()
      window.removeEventListener("beforeunload", handleBeforeUnload)
      setUsers([])
    }
  }, [userName, isEditorReady, ydoc, yText])

  if (!userName) {
    return (
      <main className="min-h-screen w-full bg-gray-950 flex gap-4 p-4 items-center justify-center">
        <form onSubmit={handleJoin} className="flex flex-col gap-4 w-full max-w-sm">
          <input
            type="text"
            name="userName"
            placeholder="Enter your name"
            className="p-2 rounded-md bg-gray-800 text-white"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
          <button type="submit" className="p-2 rounded-md bg-blue-600 text-white">
            Join
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="min-h-screen w-full bg-gray-950 flex gap-4 p-4">
      <aside className="min-h-screen w-1/4 bg-amber-50 rounded-lg">
        {users.length === 0 ? (
          <p className="p-2 text-sm text-gray-700">No active users</p>
        ) : (
          <>
            <p className="p-2 text-sm text-gray-700">Active users:</p>
            {users.map((user, index) => (
              <div key={`${user.name}-${index}`} className="p-2 flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: user.color || "#9CA3AF" }}
                ></span>
                {user.name}
              </div>
            ))}
          </>
        )}
      </aside>
      <section className=" min-h-screen w-3/4 bg-neutral-800 rounded-lg">
        <Editor // this one this javaScript Editore you see to Right side on UI
          height="100%"
          defaultLanguage="javascript"
          defaultValue="// some comment"
          theme="vs-dark"
         onMount={handleMount}
        />

      </section>

    </main>
  )
}
export default App;