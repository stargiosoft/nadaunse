import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";

// Sentry 초기화 (앱 렌더링 전)
initSentry();

createRoot(document.getElementById("root")!).render(<App />);

// FOUC 방지: React 첫 렌더 + 브라우저 paint 완료 후 흰색 오버레이 제거
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.getElementById('fouc-guard')?.remove();
  });
});
