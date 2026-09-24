# AGENTS.md — Cowork entegrasyon kılavuzu

Bu dosya, Alos ToDo uygulaması ile Cowork ajanı (Gmail erişimi olan bir Claude Code oturumu) arasındaki **tek** entegrasyon yüzeyidir. Ayrı bir API yok — Cowork, uygulamanın da kullandığı Supabase Postgres veritabanına doğrudan okuma/yazma yapar. Uygulama sadece bu verinin üzerinde bir arayüzdür.

Cowork'ün Gmail erişimi tamamen ayrı, kendi entegrasyonudur — Alos'un bundan haberi yok ve Alos hiçbir zaman Gmail'e bağlanmaz. Cowork sadece okuduğu maildeki bilgiyi Alos'un veritabanına yazar.

## Bağlantı

**Standart yöntem — her kişi kendi Alos hesabıyla (önerilen):**

Bunun için özel bir bağlayıcı/MCP sunucusu kurmana **gerek yok** — Cowork'ün (Claude Code) zaten varsayılan olarak sahip olduğu terminal/`curl` erişimi yeterli. İki adım:

**1. Giriş yap** (kişinin zaten sahip olduğu Alos giriş bilgileriyle — email + parola, Gmail'le hiçbir ilgisi yok):

```bash
curl -s -X POST "https://krajvamaaaurwqsrrhgx.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: {SUPABASE_PUBLISHABLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email":"KISININ_EMAILI","password":"KISININ_PAROLASI"}'
```

Dönen JSON içindeki `access_token`'ı al.

**2. Bu token'la okuma/yazma yap** (aşağıdaki örnek bir liste oluşturuyor):

```bash
curl -s -X POST "https://krajvamaaaurwqsrrhgx.supabase.co/rest/v1/lists" \
  -H "apikey: {SUPABASE_PUBLISHABLE_KEY}" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"title":"...","mail_loop_name":"..."}'
```

Aynı desenle `todos` tablosuna da `POST https://.../rest/v1/todos`, güncelleme için `PATCH https://.../rest/v1/todos?id=eq.<id>`, okuma için `GET https://.../rest/v1/lists?select=*` şeklinde istek atılır (standart PostgREST arayüzü — Supabase'in kendi REST API'si).

Bu girişten sonra yaptığın her insert/update **otomatik olarak o kişiye ait sayılır** (`user_id` sütunu `auth.uid()`'den kendiliğinden dolar) — Kural 1-2'deki SQL örneklerinde (ki bu curl istekleriyle birebir aynı işi yapar) ayrıca `user_id` belirtmene gerek yok.

- `SUPABASE_URL`: `https://krajvamaaaurwqsrrhgx.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY`: hassas değil, uygulamanın `.env.example`'ında da var, paylaşılabilir.
- Gizli tutulması gereken tek şey: kişinin kendi Alos parolası (zaten sadece o kişide olmalı).

Bu yöntemle her kişinin Cowork'ü **sadece kendi verisine** yazabilir — veritabanı seviyesinde garanti edilir, başkasının satırına dokunmak mümkün değildir.

**İleri seviye — hesap sahibinin isteğe bağlı kullanımı:**

Tek bir Cowork oturumu birden fazla kişinin mailini aynı anda işleyecekse, `SUPABASE_SECRET_KEY` (RLS'i bypass eden service-role anahtarı) kullanılabilir. Bu anahtar **çok güçlü** (tüm kullanıcıların verisine erişir) — sadece hesap sahibinde kalmalı, başka kimseyle paylaşılmamalı. Bu yöntemi kullanırken, hangi kişi için yazıldığını belirtmek üzere `user_id`'yi elle set etmek gerekir; ilgili kişinin `user_id`'sini Supabase Studio → Authentication → Users'dan bul (bu dosya herkese açık paylaşılabildiği için gerçek `user_id`'ler burada listelenmiyor).

Aşağıdaki Kural 1-2'deki SQL örnekleri **standart yöntemi** (kendi hesabıyla giriş) varsayar. Secret key ile çalışıyorsan, örneklerdeki her insert'e `user_id` sütununu Supabase Studio'dan bulduğun ilgili kişinin id'siyle elle eklemen gerekir.

Şema kaynağı: `supabase/migrations/*.sql` (kronolojik sırayla uygula/oku). Aşağıdaki özet, güncel durumu yansıtır ama migration dosyaları asıl doğruluk kaynağıdır.

## Çalışma modeli

Cowork, **manuel tetiklenerek** çalışır — zamanlanmış/otomatik bir görev değil. Kullanıcı ne zaman isterse Cowork'e "mailleri kontrol et" der, Cowork Kural 1'i uygular. Benzer şekilde bir görev tamamlandığında kullanıcı Cowork'e "şu görev tamamlandı, mail at" der, Cowork Kural 2'yi uygular. Cowork kendi kendine arka planda dönmez.

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
   insert into lists (title, mail_loop_name, sort_order)
   values ($1, $1, (select coalesce(max(sort_order), -1) + 1 from lists))
   on conflict (user_id, mail_loop_name) do nothing
   returning id;
   ```
   `$1` = mailden çıkardığın temiz konu başlığı (`title` ve `mail_loop_name` aynı değer olabilir). Satır dönmezse (conflict oldu, yani aslında zaten varmış) aynı `mail_loop_name` ile `select id from lists where mail_loop_name = $1` yaparak mevcut satırı al.
   - `app_settings.main_folder_path` doluysa, listenin klasörünü de **sen** oluştur (uygulama sadece kendi arayüzünden açılan listeler için bunu yapıyor): `<main_folder_path>/<sanitize(title)> - <id'nin ilk 6 hex karakteri>` yolunda klasör aç, `lists.folder_path` alanına yaz.
5. Bu listeyi (yeni veya eşleşen) artık o konudaki gelecek mailler için de "izlemede" say — aynı `mail_loop_name`'e bir daha eşleşen her mail bu listeye todo olarak eklenmeye devam eder.
6. Idempotent insert yap (aynı mail için ikinci kayıt oluşmasın):
   ```sql
   insert into todos (list_id, content, source_email_id)
   values ($1, $2, $3)
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

Bu kural Cowork tarafından **kullanıcı istediğinde** (örn. "şu görev bitti, mail at") çalıştırılır — kullanıcı işi bitirip dosyayı klasöre koyduktan ve uygulamada "tamamlandı" işaretledikten sonra.

1. İlgili görevi bul (`todos.done = true`, `source_email_id is not null`).
2. **`todos.folder_path`** altındaki dosyayı al (bu klasör null ise `lists.folder_path`'e düş).
3. İlgili listenin `mail_loop_name`'ini kullanarak, o loop'a/thread'e tamamlanma maili gönder; dosyayı ekle.
4. "İlgili dosya hangisi" sorusu (klasörde birden fazla dosya varsa) Cowork'ün kendi muhakemesine bırakılıyor — uygulama bunu zorlamıyor.
5. `completed_at` zaten `done = true` olduğunda trigger tarafından otomatik dolduruldu — elle bir şey yapmana gerek yok, sadece maili göndermen yeterli.

## Kural 3 — Ne yapmaman gerekiyor

- `app_settings.main_folder_path`'i Cowork değiştirmemeli — bu sadece ilgili kişinin kendi masaüstü Ayarlar ekranından değiştirdiği bir alan.
- Secret key (ileri seviye yöntem) kullanıyorsan, bir kişinin verisini başka bir kişinin `user_id`'siyle karıştırmamak kritik. Standart yöntemde (kendi hesabıyla giriş) bu zaten mümkün değil.
- Uygulamadan elle eklenen görevleri (`source_email_id is null`) tamamlanmış işaretleme, silme ya da içeriğini değiştirme — bunlar sadece kullanıcının kendi checklist'i.
- Aynı konudaki mailler için tekrar tekrar yeni liste açma — önce mevcut listelerle eşleşme dene (Kural 1, adım 3), sadece gerçekten yeni bir konu olduğuna eminsen yeni liste aç.
- Bu dosyanın dışında bir API/endpoint yok; her şey doğrudan Postgres üzerinden.
