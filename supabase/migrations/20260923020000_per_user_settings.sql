-- app_settings artık global tek satır değil, kullanıcı başına bir satır.
-- Yeni bir kullanıcı eklendiğinde kendi ana klasörünü ayrı ayarlayabilir.

alter table public.app_settings drop constraint app_settings_singleton;
alter table public.app_settings add column user_id uuid references auth.users(id);

update public.app_settings
set user_id = 'b5ee4ee9-a932-4625-8849-336054b642a4'
where user_id is null;

alter table public.app_settings alter column user_id set not null;
alter table public.app_settings drop constraint app_settings_pkey;
alter table public.app_settings drop column id;
alter table public.app_settings add primary key (user_id);
alter table public.app_settings alter column user_id set default auth.uid();

drop policy "app_settings_authenticated_all" on public.app_settings;
create policy "app_settings_owner_all" on public.app_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
