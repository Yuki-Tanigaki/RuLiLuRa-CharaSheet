// src/pages/HeroSheetFeature.jsx （配置はあなたの構成に合わせて）
// ※ import パスは今のHeroSheetFeatureの位置に合わせて調整してね

import React, { useEffect, useMemo, useState } from "react";
import HeroSheet from "./sheets/heroSheet/HeroSheet.jsx";
import { defaultHeroState } from "./sheets/heroSheet/defaultHeroState.js";
import { commitHistory } from "../lib/versioning.js";
import { buildShareUrl, decodeStateFromParam, readStateParamFromHash } from "../lib/shareUrl.js";

// 追加：JSON保存/読込
import { exportJson, importJsonViaPicker, saveState, loadState } from "../lib/storage.js";

export default function HeroSheetFeature() {
  const [mode, setMode] = useState("view"); // "view" | "edit" | "create"

  // もし「前回の状態を復元」もしたいなら loadState を使う（不要なら defaultHeroState のままでOK）
  const [hero, setHero] = useState(() => loadState({ sheetType: "hero" }) ?? defaultHeroState());

  const sheetType = "hero";

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

    // そのまま反映（必要なら migrate/validate をここに挟む）
    setHero(imported);

    // 読み込んだら編集にしておくのが親切（好みで view にしてもOK）
    setMode("edit");

    saveState(imported, { sheetType });
  }

  // 初回：URLから復元
  useEffect(() => {
    const param = readStateParamFromHash();
    const restored = decodeStateFromParam(param);
    if (restored && typeof restored === "object") {
      setState(restored);
      // 共有URLから開いた時は編集できた方が便利なら edit にする等
      // setMode("edit");
    }
    // 初回のみ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleShare() {
    const url = buildShareUrl({
      // ここはあなたのルーティングに合わせて
      // 例：#/sheets/hero なら "/sheets/hero" を渡す
      path: "/sheets/hero",
      state,
    });

    // URL長すぎ警告（ブラウザ/共有先で死ぬのを避ける）
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
      </div>

      <HeroSheet
        state={hero}
        mode={mode}
        setState={(next) => {
          // next が関数更新でも値更新でも対応
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
      />
    </div>
  );
}
