# Alos

Kişiye özel, Cowork tarafından beslenen ToDo uygulaması. macOS masaüstü uygulaması (Tauri) + mobil PWA, ortak bir Supabase veritabanı üzerinden senkron çalışır.

## Geliştirme

```bash
npm install
npm run tauri dev      # masaüstü, hot-reload
npm run dev -- --mode pwa   # mobil/PWA tarayıcı testi
```

`.env.example`'dan `.env` oluşturup Supabase proje URL'i ve publishable key'ini doldurman gerekir.

## Yeni sürüm yayınlama (auto-update)

1. `src-tauri/tauri.conf.json`'daki `version` alanını bump et (örn. `0.2.0`).
2. Değişikliği commit'le.
3. Bir sürüm tag'i oluşturup push et:
   ```bash
   git tag v0.2.0
   git push --follow-tags
   ```
4. Bu, `.github/workflows/release.yml`'i tetikler: GitHub Actions macOS runner üzerinde uygulamayı build edip updater imza anahtarıyla imzalar, bir GitHub Release taslağı oluşturur ve `latest.json` + `.dmg`/`.app.tar.gz`/`.sig` dosyalarını yükler.
5. Workflow tamamlanınca [Releases](https://github.com/CanKarpat/alos-todo-app/releases) sayfasından release'i kontrol edip yayınla (draft değilse otomatik yayınlanır).
6. Kurulu olan Alos uygulamaları, açılışta otomatik güncelleme kontrolü yapar ve yeni sürüm bulunca kurulum için onay ister.

### Gerekli GitHub repo secret'ları

Bu workflow'un çalışması için repoya (Settings → Secrets and variables → Actions) şu secret'ların eklenmiş olması gerekir:

- `TAURI_SIGNING_PRIVATE_KEY` — `~/.tauri/alos-todo-app.key` dosyasının tam içeriği
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — bu anahtarın parolası
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable/anon key

Bu üçü de sadece build sırasında kullanılır; private key ve parolası hiçbir zaman bu repoya commit edilmemeli.

## Apple code-signing

Kişisel kullanım için Apple Developer ID notarization atlanıyor. İlk açılışta macOS "geliştirici doğrulanamadı" uyarısı verebilir — uygulama ikonuna sağ tıklayıp "Aç" seçmek yeterli. Bu, updater'ın imza kontrolünü etkilemez (o ayrı, `tauri signer` ile yapılan bir imza).
