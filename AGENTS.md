# AGENTS.md — Cowork entegrasyon kılavuzu

Bu dosya, Alos ToDo uygulaması ile Cowork ajanı (Gmail erişimi olan bir Claude Code oturumu) arasındaki **tek** entegrasyon yüzeyidir. Ayrı bir API yok — Cowork, uygulamanın da kullandığı Supabase Postgres veritabanına doğrudan okuma/yazma yapar. Uygulama sadece bu verinin üzerinde bir arayüzdür.

## Bağlantı

- `SUPABASE_URL`: `https://krajvamaaaurwqsrrhgx.supabase.co`
- `SUPABASE_SECRET_KEY`: Cowork'ün kendi yerel ortamında tutulur (bu repoya asla girmez). RLS'i bypass eden service-role anahtarı — proje genelinde tek bir anahtar, tüm kullanıcıların verisine erişebilir.
- Uygulama çok kullanıcılı: her kişinin kendi Supabase Auth hesabı ve kendi `user_id`'si var. Cowork, secret key ile yazdığında `auth.uid()` context'i olmadığı için, hangi kişi için işlem yapıyorsa **o kişinin `user_id`'sini** `lists`/`todos`/`app_settings` satırlarına elle set etmesi gerekir. Aşağıdaki SQL örneklerinde `$user_id` bu şekilde, işlenen kişiye göre değişir.

**Bilinen kullanıcılar** (Supabase Studio → Authentication → Users'dan `user_id` alınır, buraya eklenir):

| Kişi | user_id |
|---|---|
| Can (hesap sahibi) | `8d06686e-efaa-432e-998c-aa70605bb2ab` |
| Yeni kullanıcı | `b5ee4ee9-a932-4625-8849-336054b642a4` |

Yeni bir kişi eklendiğinde: (1) hesap sahibi Supabase Studio'dan o kişi için bir Auth kullanıcısı oluşturur, (2) oluşan `user_id` bu tabloya eklenir, (3) o kişinin hangi Gmail loop'larının/maillerinin hangi `user_id`'ye ait olduğunu Cowork bilir hale gelir (örn. birden fazla kişinin mailini tek Cowork oturumu işliyorsa, kişiyi mail adresinden/bağlamdan ayırt eder).

Şema kaynağı: `supabase/migrations/*.sql` (kronolojik sırayla uygula/oku). Aşağıdaki özet, güncel durumu yansıtır ama migration dosyaları asıl doğruluk kaynağıdır.

## Çalışma modeli

Cowork, zamanlanmış (örn. her 10-15 dakikada bir) çalışan bir görev olarak kurulmalı — kullanıcı elle tetiklemeden, arka planda Gmail'i kontrol edip Kural 1-2'yi uygular.

## Şema özeti

```
app_settings (kullanıcı başına bir satır)
  user_id uuid (primary key)
  main_folder_path text   -- o kullanıcının masaüstünde seçtiği ana klasör

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

## Kural 1 — Gelen maili değerlendir, gerekirse liste aç, todo olarak ekle

Kullanıcı önceden liste oluşturmuyor — **Cowork mailleri kendi anlayışıyla değerlendirip hangi maillerin bir TODO olduğuna karar veriyor** ve gerekirse yeni bir liste (mail loop) kendisi açıyor. Masaüstü uygulamasından elle liste oluşturmak da hâlâ mümkün, ikisi çakışmaz.

1. Gelen bir mailin kullanıcıyla ilgili bir görev/TODO temsil edip etmediğine karar ver. Değilse hiçbir şey yapma.
2. Öyle ise, mailin konusunu (gerekirse `Re:`, `Fwd:` gibi önekleri temizleyip) bir **loop konusu** olarak çıkar.
3. `lists` tablosunda bu konuya karşılık gelen bir satır olup olmadığını kontrol et. Eşleştirmeyi **case-insensitive, trim'lenmiş ve anlam bazlı** yap (`lower(trim(mail_loop_name))` karşılaştırması + gerekirse yakın konu başlıklarını aynı thread'in devamı olarak tanı) — birebir string eşleşmesi şart değil, amaç aynı konuşmayı tek listede tutmak.
4. **Eşleşen liste yoksa yeni bir tane aç**:
   ```sql
   insert into lists (title, mail_loop_name, user_id, sort_order)
   values ($1, $1, $user_id,
           (select coalesce(max(sort_order), -1) + 1 from lists where user_id = $user_id))
   on conflict (user_id, mail_loop_name) do nothing
   returning id;
   ```
   `$1` = mailden çıkardığın temiz konu başlığı (`title` ve `mail_loop_name` aynı değer olabilir). `$user_id` = bu mailin ait olduğu kişinin `user_id`'si (bkz. Bağlantı bölümündeki tablo). Satır dönmezse (conflict oldu, yani aslında zaten varmış) aynı `mail_loop_name` + `user_id` ile `select id from lists where ...` yaparak mevcut satırı al.
   - O kişinin `app_settings.main_folder_path` (`where user_id = $user_id`) doluysa, listenin klasörünü de **sen** oluştur (uygulama sadece kendi arayüzünden açılan listeler için bunu yapıyor): `<main_folder_path>/<sanitize(title)> - <id'nin ilk 6 hex karakteri>` yolunda klasör aç, `lists.folder_path` alanına yaz.
5. Bu listeyi (yeni veya eşleşen) artık o konudaki gelecek mailler için de "izlemede" say — aynı `mail_loop_name`'e bir daha eşleşen her mail bu listeye todo olarak eklenmeye devam eder.
6. Idempotent insert yap (aynı mail için ikinci kayıt oluşmasın):
   ```sql
   insert into todos (list_id, content, source_email_id, user_id)
   values ($1, $2, $3, $user_id)
   on conflict (list_id, source_email_id) where source_email_id is not null
   do nothing;
   ```
7. **Klasör oluşturma Cowork'ün sorumluluğunda**: uygulama sadece kendi arayüzünden eklenen todo'lar için klasör açıyor; Cowork'ün eklediği todo'lar için de aynı işi Cowork yapmalı:
   - İlgili listenin `folder_path` değerini oku. `null` ise (ana klasör henüz seçilmemiş) klasör açma, `todos.folder_path`'i `null` bırak.
   - Doluysa: `<lists.folder_path>/<sanitize(content)> - <id'nin ilk 6 hex karakteri>` yolunda bir klasör oluştur.
   - `sanitize(text)` kuralı (uygulamanın kendi mantığıyla birebir aynı olmalı — bkz. `src/lib/folders.ts`): `/ \ : * ? " < > |` karakterlerini `-` ile değiştir, ardışık boşlukları teke indir, baştan/sondan trim'le, 60 karakterde kes; sonuç boşsa `"İsimsiz"` kullan.
   - Oluşan yolu `todos.folder_path` alanına yaz.
8. Uygulamadan elle eklenen görevlere (`source_email_id is null`) dokunma — sadece mail kaynaklı görevleri işle/tamamla.

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

- `app_settings.main_folder_path`'i Cowork değiştirmemeli — bu sadece ilgili kişinin kendi masaüstü Ayarlar ekranından değiştirdiği bir alan.
- Bir kişinin verisini başka bir kişinin `user_id`'siyle karıştırmamak kritik — her zaman doğru kişinin `user_id`'sini kullan (bkz. Bağlantı bölümündeki tablo).
- Uygulamadan elle eklenen görevleri (`source_email_id is null`) tamamlanmış işaretleme, silme ya da içeriğini değiştirme — bunlar sadece kullanıcının kendi checklist'i.
- Aynı konudaki mailler için tekrar tekrar yeni liste açma — önce mevcut listelerle eşleşme dene (Kural 1, adım 3), sadece gerçekten yeni bir konu olduğuna eminsen yeni liste aç.
- Bu dosyanın dışında bir API/endpoint yok; her şey doğrudan Postgres üzerinden.
