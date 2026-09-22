import { useState } from "react";
import type { List } from "../lib/types";
import { pickFolder } from "../lib/platform";

type Props = {
  lists: List[];
  onRenameList: (
    id: string,
    title: string,
    mailLoopName: string,
    folderPath: string | null
  ) => Promise<{ error: unknown }>;
  onDeleteList: (id: string) => void;
  onCreateList: (
    title: string,
    mailLoopName: string,
    folderPath: string | null
  ) => Promise<{ error: unknown }>;
  onClose: () => void;
};

function ListRow({
  list,
  onRename,
  onDelete,
}: {
  list: List;
  onRename: Props["onRenameList"];
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState(list.title);
  const [mailLoopName, setMailLoopName] = useState(list.mail_loop_name);
  const [folderPath, setFolderPath] = useState(list.folder_path);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty =
    title !== list.title ||
    mailLoopName !== list.mail_loop_name ||
    folderPath !== list.folder_path;

  async function handleSave() {
    setError(null);
    setSaving(true);
    const { error } = await onRename(list.id, title.trim(), mailLoopName.trim(), folderPath);
    setSaving(false);
    if (error) setError("Bu başlık veya mail loop adı zaten kullanılıyor.");
  }

  async function handlePickFolder() {
    const path = await pickFolder();
    if (path) setFolderPath(path);
  }

  return (
    <div className="settings-list-row">
      <div className="settings-list-row-fields">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          placeholder="Liste başlığı"
        />
        <input
          type="text"
          value={mailLoopName}
          onChange={(e) => setMailLoopName(e.currentTarget.value)}
          placeholder="Mail loop adı"
        />
      </div>
      <div className="settings-list-row-folder">
        <span className="settings-folder-path">{folderPath || "Klasör seçilmedi"}</span>
        <button type="button" onClick={handlePickFolder}>
          Klasör Seç
        </button>
      </div>
      <div className="settings-list-row-actions">
        {dirty && (
          <button type="button" onClick={handleSave} disabled={saving}>
            Kaydet
          </button>
        )}
        <button
          type="button"
          className="settings-delete-button"
          onClick={() => {
            if (confirm(`"${list.title}" listesi ve içindeki tüm görevler silinsin mi?`)) {
              onDelete(list.id);
            }
          }}
        >
          Sil
        </button>
      </div>
      {error && <p className="sidebar-create-error">{error}</p>}
    </div>
  );
}

export function SettingsPanel({ lists, onRenameList, onDeleteList, onCreateList, onClose }: Props) {
  const [newTitle, setNewTitle] = useState("");
  const [newMailLoopName, setNewMailLoopName] = useState("");
  const [newFolderPath, setNewFolderPath] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    const t = newTitle.trim();
    const m = newMailLoopName.trim();
    if (!t || !m) return;
    const { error } = await onCreateList(t, m, newFolderPath);
    if (error) {
      setCreateError("Bu başlık veya mail loop adı zaten kullanılıyor.");
      return;
    }
    setNewTitle("");
    setNewMailLoopName("");
    setNewFolderPath(null);
  }

  async function handlePickNewFolder() {
    const path = await pickFolder();
    if (path) setNewFolderPath(path);
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Ayarlar</h2>
          <button type="button" onClick={onClose}>
            Kapat
          </button>
        </div>

        <section className="settings-section">
          <h3>Listeler</h3>
          <div className="settings-list-rows">
            {lists.map((list) => (
              <ListRow key={list.id} list={list} onRename={onRenameList} onDelete={onDeleteList} />
            ))}
          </div>

          <form className="settings-create-form" onSubmit={handleCreate}>
            <div className="settings-list-row-fields">
              <input
                type="text"
                placeholder="Yeni liste başlığı"
                value={newTitle}
                onChange={(e) => setNewTitle(e.currentTarget.value)}
              />
              <input
                type="text"
                placeholder="Mail loop adı"
                value={newMailLoopName}
                onChange={(e) => setNewMailLoopName(e.currentTarget.value)}
              />
            </div>
            <div className="settings-list-row-folder">
              <span className="settings-folder-path">
                {newFolderPath || "Klasör seçilmedi (opsiyonel)"}
              </span>
              <button type="button" onClick={handlePickNewFolder}>
                Klasör Seç
              </button>
            </div>
            <button type="submit">+ Liste Ekle</button>
          </form>
          {createError && <p className="sidebar-create-error">{createError}</p>}
        </section>
      </div>
    </div>
  );
}
