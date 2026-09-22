import type { Todo } from "../lib/types";
import { TodoItem } from "./TodoItem";
import { AddTodoInput } from "./AddTodoInput";

type Props = {
  listTitle: string;
  todos: Todo[];
  onToggle: (id: string, done: boolean) => void;
  onAdd: (content: string) => void;
};

export function TodoList({ listTitle, todos, onToggle, onAdd }: Props) {
  return (
    <main className="content">
      <h1 className="list-heading">{listTitle}</h1>

      <ul className="todo-list">
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onToggle={onToggle} />
        ))}
      </ul>

      <AddTodoInput onAdd={onAdd} />
    </main>
  );
}
