// test/pages/sheets/heroSheet/HeroTest.jsx
import React, { useEffect, useState } from "react";

import HeroSheet from "/src/pages/sheets/heroSheet/HeroSheet.jsx";
import { defaultHeroState } from "/src/pages/sheets/heroSheet/defaultHeroState.js";

import { commitHistory } from "/src/lib/versioning.js";
import { buildShareUrl, decodeStateFromParam, readStateParamFromHash } from "/src/lib/shareUrl.js";
import { exportJson, importJsonViaPicker, saveState, loadState } from "/src/lib/storage.js";

export default function HeroTest() {
  const sheetType = "hero";

  const [mode, setMode] = useState("view"); // "view" | "edit" | "create"
  const [sheetState, setSheetState] = useState(() => {
    return loadState({ sheetType }) ?? defaultHeroState();
  });

  // HeroSheet に渡す setState（保存つき）
  const setStateWithPersist = (next) => {
    setSheetState((prev) => {
      const v = typeof next === "function" ? next(prev) : next;
      saveState(v, { sheetType });
      return v;
    });
  };

  function handleCreate() {
    const s = defaultHeroState();
    setSheetState(s);
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
    commitHistory(sheetState, "", sheetType);
    window.dispatchEvent(new Event("rulilura:history-updated"));
  }

  function handleJsonExport() {
    exportJson(sheetState, { sheetType });
  }

  async function handleJsonImport() {
    const imported = await importJsonViaPicker();
    if (!imported) return;

    setSheetState(imported);
    setMode("edit");
    saveState(imported, { sheetType });
  }

  useEffect(() => {
    // URL hash の s= から復元（共有URLを貼り付けて開いた場合）
    const param = readStateParamFromHash();
    const restored = decodeStateFromParam(param);
    if (restored && typeof restored === "object") {
      setSheetState(restored);
      setMode("view");
      saveState(restored, { sheetType });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleShare() {
    const url = buildShareUrl({
      path: "/sheets/hero",
      state: sheetState,
    });

    if (url.length > 8000) {
      alert(
        `共有URLが長すぎます（${url.length}文字）。\n所持品やメモが多い場合、短縮/サーバ保存方式を検討してください。`
      );
    }

    await navigator.clipboard.writeText(url);
    alert("共有URLをコピーしました！");
  }

  return (
    <div>
      {/* テスト用ツールバー（必要なら消してOK） */}
      <div style={{ display: "flex", gap: 8, margin: "8px 0", flexWrap: "wrap" }}>
        <button type="button" onClick={handleJsonExport}>
          JSON保存
        </button>
        <button type="button" onClick={handleJsonImport}>
          JSON読み出し
        </button>

        <button type="button" onClick={handleCreate}>
          作成
        </button>
        <button type="button" onClick={handleEdit}>
          編集
        </button>
        <button type="button" onClick={handleView}>
          閲覧
        </button>

        <button type="button" onClick={handleSaveHistory}>
          履歴に保存
        </button>
        <button type="button" onClick={handleShare}>
          共有URLコピー
        </button>

        <span style={{ marginLeft: 8, opacity: 0.7 }}>
          mode: <b>{mode}</b>
        </span>
      </div>

      <HeroSheet
        state={sheetState}
        mode={mode}
        setState={setStateWithPersist}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onView={handleView}
        onSaveHistory={handleSaveHistory}
        onShare={handleShare}
      />
    </div>
  );
}
