import type { Todo } from "../lib/types";

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
    </li>
  );
}
