import { isTauri as checkIsTauri } from "@tauri-apps/api/core";

export function isTauri(): boolean {
  return checkIsTauri();
}

export async function pickFolder(): Promise<string | null> {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const result = await open({ directory: true, multiple: false });
  return typeof result === "string" ? result : null;
}
