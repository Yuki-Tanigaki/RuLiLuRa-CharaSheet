// src/pages/Home.jsx

import React, { useEffect, useState } from "react";
import HeroSheet from "./sheets/heroSheet/HeroSheet.jsx";
import { defaultHeroState } from "./sheets/heroSheet/defaultHeroState.js";
import { commitHistory } from "../lib/versioning.js";
import { buildShareUrl, decodeStateFromParam, readStateParamFromHash } from "../lib/shareUrl.js";
import { exportJson, importJsonViaPicker, saveState, loadState } from "../lib/storage.js";

export default function Home() {
  const [mode, setMode] = useState("view"); // "view" | "edit" | "create"

  const sheetType = "hero";
  const [hero, setHero] = useState(() => loadState({ sheetType }) ?? defaultHeroState());
  // HeroSheet側のポップアップを開くための「合図」
  const [userCatalogOpenTick, setUserCatalogOpenTick] = useState(0);

  function handleCreate() {
    const s = defaultHeroState();
    setHero(s);
    setMode("create");
    saveState(s, { sheetType });
  }

  function handleEdit() {
    setMode("edit");
  }

  function handleView() {
    setMode("view");
  }

  function handleSaveHistory() {
    commitHistory(hero, "", sheetType);
    window.dispatchEvent(new Event("rulilura:history-updated"));
  }

  function handleJsonExport() {
    exportJson(hero, { sheetType });
  }

  async function handleJsonImport() {
    const imported = await importJsonViaPicker();
    if (!imported) return;

    setHero(imported);
    setMode("edit");
    saveState(imported, { sheetType });
  }

  // 初回：URLから復元
  useEffect(() => {
    const param = readStateParamFromHash();
    const restored = decodeStateFromParam(param);
    if (restored && typeof restored === "object") {
      setHero(restored);                 // ✅ setState → setHero
      saveState(restored, { sheetType }); // ✅ ついでにローカルにも保存（任意）
      // setMode("edit"); // 共有URLから開いたら編集にしたいならON
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleShare() {
    const url = buildShareUrl({
      path: "/sheets/hero",
      state: hero, // ✅ state → hero
    });

    if (url.length > 8000) {
      alert(`共有URLが長すぎます（${url.length}文字）。\n所持品やメモが多い場合、短縮/サーバ保存方式を検討してください。`);
    }

    await navigator.clipboard.writeText(url);
    alert("共有URLをコピーしました！");
  }

  return (
    <div>
      {/* JSON操作ボタン（シート上部） */}
      <div style={{ display: "flex", gap: 8, margin: "8px 0" }}>
        <button type="button" onClick={handleJsonExport}>
          JSON保存
        </button>
        <button type="button" onClick={handleJsonImport}>
          JSON読み出し
        </button>
        <button type="button" onClick={() => setUserCatalogOpenTick((n) => n + 1)}>
          自作データ管理
        </button>
      </div>

      <HeroSheet
        state={hero}
        mode={mode}
        setState={(next) => {
          setHero((prev) => {
            const v = typeof next === "function" ? next(prev) : next;
            saveState(v, { sheetType }); // 変更のたびに自動保存
            return v;
          });
        }}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onView={handleView}
        onSaveHistory={handleSaveHistory}
        onShare={handleShare}
        userCatalogOpenTick={userCatalogOpenTick}
      />
    </div>
  );
}
