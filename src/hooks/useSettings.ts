import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { AppSettings } from "../lib/types";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    function fetchSettings() {
      // RLS zaten sadece giriş yapan kullanıcının satırını döndürüyor.
      supabase
        .from("app_settings")
        .select("*")
        .maybeSingle()
        .then(({ data }) => {
          if (active) setSettings(data);
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
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { error: new Error("Oturum yok") };
    return supabase
      .from("app_settings")
      .upsert({ user_id: userData.user.id, main_folder_path: path });
  }

  return { settings, loading, setMainFolderPath };
}
