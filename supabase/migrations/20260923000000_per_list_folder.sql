-- Global "ana klasör" fikri terk edildi: her liste artık kendi klasör yolunu
-- doğrudan taşıyor (liste oluşturulurken native seçiciyle atanır). Bu, liste
-- başlığı = klasör adı kuralına olan kırılgan bağımlılığı ortadan kaldırır.

drop trigger if exists app_settings_set_updated_at on public.app_settings;
alter publication supabase_realtime drop table public.app_settings;
drop table public.app_settings;

alter table public.lists add column folder_path text;
alter table public.lists drop constraint if exists lists_title_unique;
