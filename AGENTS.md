# AGENTS.md — Cowork entegrasyon kılavuzu

Bu dosya, Alos ToDo uygulaması ile Cowork ajanı (Gmail erişimi olan bir Claude Code oturumu) arasındaki **tek** entegrasyon yüzeyidir. Ayrı bir API yok — Cowork, uygulamanın da kullandığı Supabase Postgres veritabanına doğrudan okuma/yazma yapar. Uygulama sadece bu verinin üzerinde bir arayüzdür.

## Bağlantı

- `SUPABASE_URL`: `https://krajvamaaaurwqsrrhgx.supabase.co`
- `SUPABASE_SECRET_KEY`: Cowork'ün kendi yerel ortamında tutulur (bu repoya asla girmez). RLS'i bypass eden service-role anahtarı.
- Sabit `user_id`: `b5ee4ee9-a932-4625-8849-336054b642a4` — Cowork secret key ile yazdığında `auth.uid()` context'i olmadığı için, `lists`/`todos` satırlarına bu UUID'yi **elle** `user_id` olarak set etmesi gerekir.

Şema kaynağı: `supabase/migrations/*.sql` (kronolojik sırayla uygula/oku). Aşağıdaki özet, güncel durumu yansıtır ama migration dosyaları asıl doğruluk kaynağıdır.

## Şema özeti

```
app_settings (tek satır, id her zaman true)
  main_folder_path text   -- kullanıcının masaüstünde seçtiği ana klasör

lists
  id uuid
  title text                -- görünen başlık
  mail_loop_name text       -- Gmail loop eşleme anahtarı, unique
  folder_path text          -- main_folder_path/<title> - <kısa id>, uygulama tarafından otomatik oluşturulur
  sort_order int

todos
  id uuid
  list_id uuid -> lists.id
  content text
  done boolean
  source_email_id text      -- Gmail message id, idempotency için
  folder_path text          -- lists.folder_path/<content> - <kısa id>
  completed_at timestamptz  -- done=true olunca trigger otomatik dolduruyor
```

## Kural 1 — Gelen maili doğru listeye todo olarak ekle

1. Mailin ait olduğu loop'u (Cowork'ün kendi Gmail label/subject konvansiyonu neyse) belirle.
2. `lists` tablosunda `mail_loop_name` eşleşen satırı bul. Eşleştirmeyi **case-insensitive ve trim'lenmiş** yap (`lower(trim(mail_loop_name)) = lower(trim(loop_adı))`) — kullanıcı ayarlar ekranında yazarken küçük farklılıklar olabilir.
3. Idempotent insert yap (aynı mail için ikinci kayıt oluşmasın):
   ```sql
   insert into todos (list_id, content, source_email_id, user_id)
   values ($1, $2, $3, 'b5ee4ee9-a932-4625-8849-336054b642a4')
   on conflict (list_id, source_email_id) where source_email_id is not null
   do nothing;
   ```
4. **Klasör oluşturma Cowork'ün sorumluluğunda**: uygulama sadece kendi arayüzünden eklenen todo'lar için klasör açıyor; Cowork'ün eklediği todo'lar için de aynı işi Cowork yapmalı:
   - İlgili listenin `folder_path` değerini oku. `null` ise (ana klasör henüz seçilmemiş) klasör açma, `todos.folder_path`'i `null` bırak.
   - Doluysa: `<lists.folder_path>/<sanitize(content)> - <id'nin ilk 6 hex karakteri>` yolunda bir klasör oluştur.
   - `sanitize(text)` kuralı (uygulamanın kendi mantığıyla birebir aynı olmalı — bkz. `src/lib/folders.ts`): `/ \ : * ? " < > |` karakterlerini `-` ile değiştir, ardışık boşlukları teke indir, baştan/sondan trim'le, 60 karakterde kes; sonuç boşsa `"İsimsiz"` kullan.
   - Oluşan yolu `todos.folder_path` alanına yaz.

## Kural 2 — Görev tamamlandığında

1. İşi bitirince ilgili dosyayı **`todos.folder_path`** altına koy (bu klasör null ise `lists.folder_path`'e düş; o da null ise dosyayı e-postaya doğrudan ekle).
2. Görevi tamamlandı işaretle:
   ```sql
   update todos set done = true where id = $1;
   ```
   (`completed_at` trigger tarafından otomatik dolduruluyor — elle set etmeye gerek yok.)
3. İlgili listenin `mail_loop_name`'ini kullanarak, o loop'a/thread'e tamamlanma maili gönder; `todos.folder_path` altındaki dosyayı ekle.
4. "İlgili dosya hangisi" sorusu (klasörde birden fazla dosya varsa) Cowork'ün kendi muhakemesine bırakılıyor — uygulama bunu zorlamıyor.

## Kural 3 — Ne yapmaman gerekiyor

- `app_settings.main_folder_path`'i Cowork değiştirmemeli — bu sadece kullanıcının masaüstü Ayarlar ekranından değiştirdiği bir alan.
- Yeni bir `lists` satırı oluşturmak Cowork'ün işi değil — listeler sadece masaüstü uygulamasından, kullanıcı tarafından oluşturulur. Eşleşen `mail_loop_name` bulunamazsa, o maili işleme (ya da kullanıcıya bildir), yeni liste icat etme.
- Bu dosyanın dışında bir API/endpoint yok; her şey doğrudan Postgres üzerinden.
