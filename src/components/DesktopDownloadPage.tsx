import { useEffect, useState } from "react";

const RELEASES_API = "https://api.github.com/repos/CanKarpat/alos-todo-app/releases/latest";

export function DesktopDownloadPage() {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    fetch(RELEASES_API)
      .then((res) => res.json())
      .then((release) => {
        const dmg = release.assets?.find((a: { name: string }) => a.name.endsWith(".dmg"));
        if (dmg) {
          setDownloadUrl(dmg.browser_download_url);
          setVersion(release.tag_name);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="download-page">
      <div className="download-card">
        <h1>Alos</h1>
        <p className="download-lead">
          Bu web sürümü sadece mobil cihazlar için tasarlandı. macOS'te Alos'u
          native bir uygulama olarak kullanabilirsin.
        </p>

        {downloadUrl ? (
          <a className="download-button" href={downloadUrl}>
            macOS için indir {version && `(${version})`}
          </a>
        ) : (
          <a
            className="download-button download-button-disabled"
            href="#"
            onClick={(e) => e.preventDefault()}
          >
            macOS için indir (yükleniyor...)
          </a>
        )}

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
