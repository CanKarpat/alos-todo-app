export function DesktopDownloadPage() {
  return (
    <div className="download-page">
      <div className="download-card">
        <h1>Alos</h1>
        <p className="download-lead">
          Bu web sürümü sadece mobil cihazlar için tasarlandı. macOS'te Alos'u
          native bir uygulama olarak kullanabilirsin.
        </p>

        <a
          className="download-button download-button-disabled"
          href="#"
          onClick={(e) => e.preventDefault()}
        >
          macOS için indir (yakında)
        </a>

        <div className="download-steps">
          <h2>Kurulum</h2>
          <ol>
            <li>İndirilen .dmg dosyasını aç.</li>
            <li>Alos ikonunu Applications klasörüne sürükle.</li>
            <li>
              Applications'tan Alos'u aç. İlk açılışta macOS "geliştirici
              doğrulanamadı" uyarısı verirse, uygulama ikonuna sağ tıklayıp
              "Aç"ı seç.
            </li>
          </ol>
        </div>

        <p className="download-hint">
          Telefonundan bu sayfayı ziyaret edip "Ana Ekrana Ekle" ile mobil
          uygulamayı kurabilirsin.
        </p>
      </div>
    </div>
  );
}
