import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { List } from "../lib/types";
import { createSubfolder } from "../lib/folders";

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

  async function addList(title: string, mailLoopName: string, mainFolderPath: string | null) {
    const result = await supabase
      .from("lists")
      .insert({ title, mail_loop_name: mailLoopName, sort_order: lists.length })
      .select()
      .single();

    if (result.data && mainFolderPath) {
      const folderPath = await createSubfolder(mainFolderPath, title, result.data.id.slice(0, 6));
      if (folderPath) {
        await supabase.from("lists").update({ folder_path: folderPath }).eq("id", result.data.id);
      }
    }

    return result;
  }

  async function renameList(id: string, title: string, mailLoopName: string) {
    return supabase.from("lists").update({ title, mail_loop_name: mailLoopName }).eq("id", id);
  }

  async function deleteList(id: string) {
    return supabase.from("lists").delete().eq("id", id);
  }

  return { lists, loading, addList, renameList, deleteList };
}
