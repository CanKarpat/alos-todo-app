# Alos Kullanım Kılavuzu

Alos, sana atanan görevleri takip ettiğin kişisel bir ToDo uygulaması. Görevler otomatik olarak e-posta üzerinden gelir; sen sadece takip edip tamamlıyorsun.

## Kurulum

1. İndirdiğin `.dmg` dosyasına çift tıkla.
   - macOS "hasar görmüş, açılamıyor" diye bir uyarı gösterirse **panik yapma** — dosya bozuk değil, bu Apple'ın imzasız uygulamalar için verdiği standart bir uyarı. Terminal uygulamasını aç ve şunu yapıştırıp Enter'a bas (indirilen dosyanın tam adını kontrol et, farklıysa ona göre düzelt):
     ```
     xattr -cr ~/Downloads/Alos*.dmg
     ```
   - Sonra dosyaya tekrar çift tıkla, bu sefer normal açılmalı.
2. Açılan pencerede **Alos** ikonunu **Applications** klasörüne sürükle.
3. Applications klasöründen Alos'u aç. Orada da benzer bir uyarı çıkarsa aynı şekilde:
   ```
   xattr -cr /Applications/Alos.app
   ```
4. Bu adımları **sadece ilk kurulumda** yapman yeterli — Alos kendini otomatik güncelliyor, bir daha bu uyarılarla karşılaşmazsın.

## Giriş

Sana verilen e-posta ve parola ile giriş yap. Bu bilgileri unutursan/kaybedersen, hesabı senin için oluşturan kişiden tekrar iste.

## Kullanım

- **Sol taraftaki liste**: sana atanan konular/projeler burada listelenir. Birine tıklayınca o konudaki görevler açılır.
- **Görev tamamlama**: bir görevin yanındaki kutucuğu işaretlemen, onu tamamlandı olarak işaretler.
- **📁 Klasör butonu**: her görevin yanında çıkan klasör ikonuna tıklarsan, o görevle ilgili dosyaların bulunduğu klasör Finder'da açılır.
- **Yeni görev ekleme**: alttaki kutuya yazıp "Ekle"ye basarak kendi görevlerini de ekleyebilirsin — bunlar sadece senin kişisel checklist'in, otomatik işlenmez.

## Mobilden kullanmak

Telefonundan tarayıcıyla sana verilen web adresine git, giriş yap, sonra:
- **iPhone (Safari)**: Paylaş → Ana Ekrana Ekle
- **Android (Chrome)**: sağ üstteki ⋮ menüsü → Ana ekrana ekle

Böylece Alos, telefonunda normal bir uygulama gibi ikonla açılır.

## Bir sorun mu var?

Uygulamayı kuran/sana veren kişiyle iletişime geç.
