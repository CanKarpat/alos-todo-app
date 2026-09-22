import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { AppSettings } from "../lib/types";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    function fetchSettings() {
      supabase
        .from("app_settings")
        .select("*")
        .single()
        .then(({ data }) => {
          if (active && data) setSettings(data);
          setLoading(false);
        });
    }

    fetchSettings();

    const channel = supabase
      .channel("app-settings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings" },
        fetchSettings
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function setMainFolderPath(path: string) {
    return supabase.from("app_settings").update({ main_folder_path: path }).eq("id", true);
  }

  return { settings, loading, setMainFolderPath };
}
