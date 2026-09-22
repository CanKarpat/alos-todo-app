-- Klasör modeli tekrar revize edildi: tek bir global "ana klasör" var,
-- liste oluşturulunca ana klasör altında liste adında bir alt klasör
-- OTOMATİK oluşturuluyor, her todo eklendiğinde de o liste klasörünün
-- altında todo'ya özel bir klasör otomatik açılıyor. Kullanıcı artık
-- klasör seçmiyor (global ana klasör hariç) — uygulama kendisi
-- oluşturup yolunu DB'ye kaydediyor, böylece Cowork da bu path'i
-- doğrudan okuyabiliyor.

create table public.app_settings (
  id boolean primary key default true,
  main_folder_path text,
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id)
);

create trigger app_settings_set_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();

alter table public.app_settings enable row level security;
create policy "app_settings_authenticated_all" on public.app_settings
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

alter publication supabase_realtime add table public.app_settings;

insert into public.app_settings (id, main_folder_path) values (true, null);

-- lists.folder_path zaten mevcut (önceki migration'dan); artık kullanıcı
-- tarafından seçilmiyor, uygulama tarafından otomatik dolduruluyor.
alter table public.todos add column folder_path text;
