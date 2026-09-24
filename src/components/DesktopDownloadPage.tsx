import { useEffect, useState } from "react";

const RELEASES_API = "https://api.github.com/repos/CanKarpat/alos-todo-app/releases/latest";

export function DesktopDownloadPage() {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [guideUrl, setGuideUrl] = useState<string | null>(null);
  const [agentsUrl, setAgentsUrl] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    fetch(RELEASES_API)
      .then((res) => res.json())
      .then((release) => {
        const dmg = release.assets?.find((a: { name: string }) => a.name.endsWith(".dmg"));
        const guide =
          release.assets?.find((a: { name: string }) => a.name === "KULLANIM.pdf") ??
          release.assets?.find((a: { name: string }) => a.name === "KULLANIM.md");
        const agents = release.assets?.find((a: { name: string }) => a.name === "AGENTS.md");
        if (dmg) {
          setDownloadUrl(dmg.browser_download_url);
          setVersion(release.tag_name);
        }
        if (guide) setGuideUrl(guide.browser_download_url);
        if (agents) setAgentsUrl(agents.browser_download_url);
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
            <li>
              İndirilen .dmg dosyasına çift tıkla. macOS "hasar görmüş,
              açılamıyor" uyarısı verirse (imzasız uygulamalar için normal,
              dosya gerçekten bozuk değil) Terminal'i aç ve şunu çalıştır:
              <br />
              <code>xattr -cr ~/Downloads/Alos*.dmg</code>
              <br />
              sonra dosyaya tekrar çift tıkla.
            </li>
            <li>Alos ikonunu Applications klasörüne sürükle.</li>
            <li>
              Applications'tan Alos'u aç. Aynı uyarı orada da çıkarsa:
              <br />
              <code>xattr -cr /Applications/Alos.app</code>
            </li>
          </ol>
        </div>

        {guideUrl && (
          <p className="download-hint">
            <a href={guideUrl}>Kullanım kılavuzunu indir</a> — uygulamanın nasıl
            kullanılacağı adım adım anlatılıyor.
          </p>
        )}

        {agentsUrl && (
          <p className="download-hint">
            <a href={agentsUrl}>Cowork entegrasyon dosyasını indir (AGENTS.md)</a> —
            kendi Cowork'ünün Alos'u kullanabilmesi için gereken kurallar.
          </p>
        )}

        <p className="download-hint">
          Telefonundan bu sayfayı ziyaret edip "Ana Ekrana Ekle" ile mobil
          uygulamayı kurabilirsin.
        </p>
      </div>
    </div>
  );
}
