import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { useLists } from "./hooks/useLists";
import { useTodos } from "./hooks/useTodos";
import { Sidebar } from "./components/Sidebar";
import { TodoList } from "./components/TodoList";
import { LoginScreen } from "./components/LoginScreen";
import { SettingsPanel } from "./components/SettingsPanel";
import "./App.css";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const { lists, addList, renameList, deleteList } = useLists();
  const { todos, addTodo, toggleTodo } = useTodos(activeListId);

  useEffect(() => {
    if (!activeListId && lists.length > 0) {
      setActiveListId(lists[0].id);
    }
  }, [lists, activeListId]);

  if (sessionLoading) return null;
  if (!session) return <LoginScreen />;

  const activeList = lists.find((l) => l.id === activeListId);

  return (
    <div className="app">
      <Sidebar
        lists={lists}
        activeListId={activeListId}
        onSelect={setActiveListId}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {activeList ? (
        <TodoList
          listTitle={activeList.title}
          todos={todos}
          onToggle={toggleTodo}
          onAdd={addTodo}
        />
      ) : (
        <main className="content">
          <p className="empty-state">Henüz liste yok.</p>
        </main>
      )}

      {settingsOpen && (
        <SettingsPanel
          lists={lists}
          onRenameList={renameList}
          onDeleteList={(id) => {
            deleteList(id);
            if (id === activeListId) setActiveListId(null);
          }}
          onCreateList={addList}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
