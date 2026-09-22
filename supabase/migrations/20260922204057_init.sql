-- Tek satırlık global ayar: ana klasör yolu, tüm listeler için ortak.
-- Boolean PK "singleton table" idiomu: id sadece `true` olabilir, bu yüzden
-- en fazla bir satır var olabilir.
create table public.app_settings (
  id boolean primary key default true,
  main_folder_path text,
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id)
);

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  title text not null,               -- aynı zamanda main_folder_path altındaki alt klasörün adı
  mail_loop_name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lists_mail_loop_name_unique unique (user_id, mail_loop_name),
  constraint lists_title_unique unique (user_id, title)
);

create table public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  content text not null,
  done boolean not null default false,
  source_email_id text,              -- Gmail message id; kullanıcı elle eklerse NULL
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Aynı mail için ikinci todo eklenmesini DB seviyesinde engelle
create unique index todos_list_source_email_unique
  on public.todos (list_id, source_email_id)
  where source_email_id is not null;

-- updated_at bookkeeping
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger app_settings_set_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();
create trigger lists_set_updated_at before update on public.lists
  for each row execute function public.set_updated_at();
create trigger todos_set_updated_at before update on public.todos
  for each row execute function public.set_updated_at();

-- completed_at otomatik yönetilir, hangi taraf (app UI ya da Cowork) done'ı çevirirse çevirsin
create or replace function public.set_completed_at()
returns trigger language plpgsql as $$
begin
  if new.done = true and old.done = false then
    new.completed_at = now();
  elsif new.done = false then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger todos_set_completed_at before update on public.todos
  for each row execute function public.set_completed_at();

-- RLS: tek kullanıcı, ama PWA public olduğu için auth.uid() üzerinden koru
alter table public.app_settings enable row level security;
alter table public.lists enable row level security;
alter table public.todos enable row level security;

create policy "app_settings_authenticated_all" on public.app_settings
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "lists_owner_all" on public.lists
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "todos_owner_all" on public.todos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Realtime: desktop + PWA anlık senkron için
alter publication supabase_realtime add table public.app_settings, public.lists, public.todos;

-- Singleton app_settings satırını baştan oluştur
insert into public.app_settings (id, main_folder_path) values (true, null);
