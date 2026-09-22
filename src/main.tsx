import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { DesktopDownloadPage } from "./components/DesktopDownloadPage";
import { isTauri, isMobileDevice } from "./lib/platform";
import "./App.css";

// Web sürümü sadece mobil için: masaüstü tarayıcıdan gelen ziyaretçiye
// uygulama yerine "Mac için indir" sayfası gösterilir. Native Tauri
// uygulaması bu kontrolden muaf, her zaman tam uygulamayı görür.
const showDesktopDownloadPage = !isTauri() && !isMobileDevice();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {showDesktopDownloadPage ? <DesktopDownloadPage /> : <App />}
  </React.StrictMode>,
);
