export type List = {
  id: string;
  title: string;
  mail_loop_name: string;
  folder_path: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Todo = {
  id: string;
  list_id: string;
  content: string;
  done: boolean;
  source_email_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};
