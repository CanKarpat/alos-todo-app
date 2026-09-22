import type { Todo } from "../lib/types";
import { isTauri } from "../lib/platform";
import { revealInFolder } from "../lib/folders";

type Props = {
  todo: Todo;
  onToggle: (id: string, done: boolean) => void;
};

export function TodoItem({ todo, onToggle }: Props) {
  return (
    <li className="todo-item">
      <input
        type="checkbox"
        checked={todo.done}
        onChange={(e) => onToggle(todo.id, e.currentTarget.checked)}
      />
      <span className={todo.done ? "todo-content done" : "todo-content"}>
        {todo.content}
      </span>
      {isTauri() && todo.folder_path && (
        <button
          type="button"
          className="todo-folder-button"
          title="Klasöre git"
          onClick={() => revealInFolder(todo.folder_path!)}
        >
          📁
        </button>
      )}
    </li>
  );
}
