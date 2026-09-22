import type { List } from "../lib/types";
import { isTauri } from "../lib/platform";

type Props = {
  lists: List[];
  activeListId: string | null;
  onSelect: (id: string) => void;
  onOpenSettings: () => void;
};

export function Sidebar({ lists, activeListId, onSelect, onOpenSettings }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-title">Listeler</div>

      {lists.map((list) => (
        <div
          key={list.id}
          className={
            list.id === activeListId ? "list-item list-item-active" : "list-item"
          }
          onClick={() => onSelect(list.id)}
        >
          {list.title}
        </div>
      ))}

      {/* Liste/mail-loop yönetimi kasıtlı olarak sadece masaüstüne özel:
          mobil/PWA tarafı sadece var olan listeleri görüntüleyip todo ekler. */}
      {isTauri() && (
        <button className="sidebar-settings-button" onClick={onOpenSettings}>
          ⚙ Ayarlar
        </button>
      )}
    </aside>
  );
}
