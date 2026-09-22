import { isTauri } from "./platform";

// Dosya sistemi için güvenli bir klasör adı üretir: yol ayraçlarını ve
// diğer sorunlu karakterleri temizler, makul bir uzunlukta keser.
export function sanitizeFolderName(text: string): string {
  const cleaned = text
    .replace(/[/\\:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60)
    .trim();
  return cleaned || "İsimsiz";
}

// `${basePath}/${sanitizeFolderName(name)} - ${uniqueSuffix}` klasörünü oluşturur
// ve oluşan tam yolu döner. Tauri dışında (mobil/PWA) veya basePath
// boşsa hiçbir şey yapmadan null döner.
export async function createSubfolder(
  basePath: string | null | undefined,
  name: string,
  uniqueSuffix: string
): Promise<string | null> {
  if (!isTauri() || !basePath) return null;

  const { mkdir } = await import("@tauri-apps/plugin-fs");
  const folderName = `${sanitizeFolderName(name)} - ${uniqueSuffix}`;
  const path = `${basePath}/${folderName}`;

  try {
    await mkdir(path, { recursive: true });
    return path;
  } catch {
    return null;
  }
}

export async function revealInFolder(path: string): Promise<void> {
  if (!isTauri()) return;
  const { revealItemInDir } = await import("@tauri-apps/plugin-opener");
  await revealItemInDir(path);
}
