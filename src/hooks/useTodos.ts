import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Todo } from "../lib/types";
import { createSubfolder } from "../lib/folders";

export function useTodos(listId: string | null) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!listId) {
      setTodos([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    function fetchTodos() {
      supabase
        .from("todos")
        .select("*")
        .eq("list_id", listId)
        .order("created_at", { ascending: true })
        .then(({ data }) => {
          if (active && data) setTodos(data);
          setLoading(false);
        });
    }

    fetchTodos();

    const channel = supabase
      .channel(`todos-changes-${listId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos", filter: `list_id=eq.${listId}` },
        fetchTodos
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [listId]);

  async function addTodo(content: string, listFolderPath?: string | null) {
    if (!listId) return;
    const result = await supabase
      .from("todos")
      .insert({ list_id: listId, content })
      .select()
      .single();

    if (result.data && listFolderPath) {
      const folderPath = await createSubfolder(listFolderPath, content, result.data.id.slice(0, 6));
      if (folderPath) {
        await supabase.from("todos").update({ folder_path: folderPath }).eq("id", result.data.id);
      }
    }

    return result;
  }

  async function toggleTodo(id: string, done: boolean) {
    return supabase.from("todos").update({ done }).eq("id", id);
  }

  async function deleteTodo(id: string) {
    return supabase.from("todos").delete().eq("id", id);
  }

  return { todos, loading, addTodo, toggleTodo, deleteTodo };
}
