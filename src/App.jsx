// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { buildAllCatalogs } from "@/common/catalog.js";
import { loadUserCatalog, saveUserCatalog } from "@/common/userCatalogStorage.js";
import { CatalogProvider } from "@/context/CatalogProvider.jsx";
import CatalogSheet from "@/pages/sheets/catalogSheet/CatalogSheet.jsx";

// ここはあなたのルーティング/ページ構成に合わせて差し替え
// 例: CatalogSheet を仮で表示しておく
// import CatalogSheet from "./pages/CatalogSheet.jsx";
function Placeholder() {
  return <div style={{ padding: 16 }}>App ready (replace with Router / Home)</div>;
}

export default function App() {
  // S1: master はアプリ起動時に1回だけロードし immutable とみなす
  const [masterCatalogs, setMasterCatalogs] = useState(null);
  const [masterError, setMasterError] = useState(null);

  // S4: userCatalog の読み書きは App のみが責務
  const [userCatalog, setUserCatalog] = useState(() => loadUserCatalog());

  // userCatalog を永続化（state更新に追従）
  useEffect(() => {
    saveUserCatalog(userCatalog);
  }, [userCatalog]);

  // masterCatalogs を初回だけロード
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const cats = await buildAllCatalogs();
        if (cancelled) return;
        setMasterCatalogs(cats);
      } catch (e) {
        if (cancelled) return;
        setMasterError(e instanceof Error ? e : new Error(String(e)));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // S1: master のロードが完了するまで App は loading... を表示し、子ページを描画しない
  if (masterError) {
    return (
      <div style={{ padding: 16 }}>
        <h3>Failed to load master catalogs</h3>
        <pre style={{ whiteSpace: "pre-wrap" }}>{String(masterError?.stack ?? masterError?.message ?? masterError)}</pre>
      </div>
    );
  }

  if (!masterCatalogs) {
    return <div style={{ padding: 16 }}>loading...</div>;
  }

  return (
    <CatalogProvider masterCatalogs={masterCatalogs} userCatalog={userCatalog}>
      <CatalogSheet userCatalog={userCatalog} setUserCatalog={setUserCatalog} />
    </CatalogProvider>
  );
}



// カタログ閲覧サンプル
// import CatalogDebugPage from "./pages/debug/CatalogDebugPage.jsx";
// export default function App() {
//   return <CatalogDebugPage />;
// }

// カタログシート
// import CatalogTest from "../test/pages/sheets/catalogSheet/CatalogTest.jsx";
// export default function App() {
//   return <CatalogTest />;
// }

// ヒーローシート
// import CatalogTest from "/test/pages/sheets/heroSheet/HeroTest.jsx";
// export default function App() {
//   return <CatalogTest />;
// }

// ヒーローシート：ヘッダー
// import HeaderTest from "/test/pages/sheets/heroSheet/HeaderTest.jsx";
// export default function App() {
//   return <HeaderTest />;
// }

// ヒーローシート：スキル
// import SkillsTest from "/test/pages/sheets/heroSheet/SkillsTest.jsx";
// export default function App() {
//   return <SkillsTest />;
// }