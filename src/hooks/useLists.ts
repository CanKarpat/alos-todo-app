import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { List } from "../lib/types";

export function useLists() {
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase
      .from("lists")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (active && data) setLists(data);
        setLoading(false);
      });

    const channel = supabase
      .channel("lists-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lists" },
        () => {
          supabase
            .from("lists")
            .select("*")
            .order("sort_order", { ascending: true })
            .then(({ data }) => {
              if (active && data) setLists(data);
            });
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function addList(title: string, mailLoopName: string, folderPath: string | null = null) {
    return supabase
      .from("lists")
      .insert({
        title,
        mail_loop_name: mailLoopName,
        folder_path: folderPath,
        sort_order: lists.length,
      })
      .select()
      .single();
  }

  async function renameList(
    id: string,
    title: string,
    mailLoopName: string,
    folderPath: string | null
  ) {
    return supabase
      .from("lists")
      .update({ title, mail_loop_name: mailLoopName, folder_path: folderPath })
      .eq("id", id);
  }

  async function deleteList(id: string) {
    return supabase.from("lists").delete().eq("id", id);
  }

  return { lists, loading, addList, renameList, deleteList };
}
