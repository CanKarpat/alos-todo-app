import { useState } from "react";
import "./App.css";

type Todo = {
  id: string;
  content: string;
  done: boolean;
};

const initialTodos: Todo[] = [
  { id: "1", content: "Tauri + React iskeletini doğrula", done: true },
  { id: "2", content: "Supabase şemasını bağla", done: false },
];

function App() {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [draft, setDraft] = useState("");

  function toggleTodo(id: string) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  function addTodo(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setTodos((prev) => [...prev, { id: crypto.randomUUID(), content, done: false }]);
    setDraft("");
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-title">Listeler</div>
        <div className="list-item list-item-active">Genel</div>
      </aside>

      <main className="content">
        <h1 className="list-heading">Genel</h1>

        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className="todo-item">
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggleTodo(todo.id)}
              />
              <span className={todo.done ? "todo-content done" : "todo-content"}>
                {todo.content}
              </span>
            </li>
          ))}
        </ul>

        <form className="add-todo" onSubmit={addTodo}>
          <input
            type="text"
            placeholder="Yeni görev ekle..."
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
          />
          <button type="submit">Ekle</button>
        </form>
      </main>
    </div>
  );
}

export default App;
