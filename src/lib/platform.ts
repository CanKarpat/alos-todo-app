import { isTauri as checkIsTauri } from "@tauri-apps/api/core";

export function isTauri(): boolean {
  return checkIsTauri();
}

export function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export async function pickFolder(): Promise<string | null> {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const result = await open({ directory: true, multiple: false });
  return typeof result === "string" ? result : null;
}

export async function checkForUpdates(): Promise<void> {
  if (!isTauri()) return;

  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const { ask } = await import("@tauri-apps/plugin-dialog");
    const { relaunch } = await import("@tauri-apps/plugin-process");

    const update = await check();
    if (!update) return;

    const shouldInstall = await ask(
      `Alos ${update.version} sürümü hazır. Şimdi indirip kurmak ister misin?`,
      { title: "Güncelleme mevcut" }
    );
    if (!shouldInstall) return;

    await update.downloadAndInstall();
    await relaunch();
  } catch {
    // Henüz yayınlanmış bir sürüm yoksa (veya ağ sorunu varsa) sessizce yut —
    // güncelleme kontrolü arka plan işi, kullanıcıya hata göstermeye gerek yok.
  }
}

export async function notify(title: string, body: string): Promise<void> {
  if (!isTauri()) return;

  const { isPermissionGranted, requestPermission, sendNotification } = await import(
    "@tauri-apps/plugin-notification"
  );

  let granted = await isPermissionGranted();
  if (!granted) {
    granted = (await requestPermission()) === "granted";
  }
  if (granted) {
    sendNotification({ title, body });
  }
}
