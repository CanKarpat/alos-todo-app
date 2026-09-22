import { useState } from "react";

type Props = {
  onAdd: (content: string) => void;
};

export function AddTodoInput({ onAdd }: Props) {
  const [draft, setDraft] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    onAdd(content);
    setDraft("");
  }

  return (
    <form className="add-todo" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Yeni görev ekle..."
        value={draft}
        onChange={(e) => setDraft(e.currentTarget.value)}
      />
      <button type="submit">Ekle</button>
    </form>
  );
}
