import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { useLists } from "./hooks/useLists";
import { useTodos } from "./hooks/useTodos";
import { useSettings } from "./hooks/useSettings";
import { Sidebar } from "./components/Sidebar";
import { TodoList } from "./components/TodoList";
import { LoginScreen } from "./components/LoginScreen";
import { SettingsPanel } from "./components/SettingsPanel";
import { notify, checkForUpdates } from "./lib/platform";
import "./App.css";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    checkForUpdates();
  }, []);

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
  const { settings, setMainFolderPath } = useSettings();

  useEffect(() => {
    if (!activeListId && lists.length > 0) {
      setActiveListId(lists[0].id);
    }
  }, [lists, activeListId]);

  const listsRef = useRef(lists);
  listsRef.current = lists;

  // Arka plandayken (örn. Cowork tarafından) yeni bir todo eklenirse native bildirim göster.
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel("todos-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "todos" },
        (payload) => {
          if (document.visibilityState !== "hidden") return;
          const todo = payload.new as { content: string; list_id: string };
          const list = listsRef.current.find((l) => l.id === todo.list_id);
          notify(list?.title ?? "Yeni görev", todo.content);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

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
          onAdd={(content) => addTodo(content, activeList.folder_path)}
        />
      ) : (
        <main className="content">
          <p className="empty-state">Henüz liste yok.</p>
        </main>
      )}

      {settingsOpen && (
        <SettingsPanel
          lists={lists}
          settings={settings}
          onRenameList={renameList}
          onDeleteList={(id) => {
            deleteList(id);
            if (id === activeListId) setActiveListId(null);
          }}
          onSetMainFolderPath={setMainFolderPath}
          onCreateList={(title, mailLoopName) =>
            addList(title, mailLoopName, settings?.main_folder_path ?? null)
          }
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
