// src/pages/SheetHub.jsx
import React, { useEffect, useMemo, useState } from "react";

import HeroSheet from "./sheets/heroSheet/HeroSheet.jsx";
import { defaultHeroState } from "./sheets/heroSheet/defaultHeroState.js";

import CatalogSheet from "./sheets/catalogSheet/CatalogSheet.jsx";
import { useCatalogSheetModel } from "./sheets/catalogSheet/useCatalogSheetModel.js";

import { commitHistory } from "../lib/versioning.js";
import { buildShareUrl, decodeStateFromParam, readStateParamFromHash } from "../lib/shareUrl.js";
import { exportJson, importJsonViaPicker, saveState, loadState } from "../lib/storage.js";

const SHEETS = {
  hero: {
    label: "英雄",
    path: "/sheets/hero",
    kind: "stateful",
    Component: HeroSheet,
    defaultState: defaultHeroState,
  },
  // diva / rarm は省略
};

function isStatefulSheet(def) {
  return (def?.kind ?? "stateful") === "stateful";
}

/** 共有カタログ（state不要） */
function CatalogSheetFeature() {
  const model = useCatalogSheetModel({ scope: "shared", editable: true });
  return <CatalogSheet model={model} />;
}

/** 最小モーダル（UserCatalogModal の Modal を流用してもOK） */
function Modal({ open, title = "自作データ管理", onClose, children }) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        padding: 12,
      }}
    >
      <div
        style={{
          width: "min(1100px, 96vw)",
          maxHeight: "92vh",
          overflow: "auto",
          background: "#fff",
          border: "2px solid #111",
          borderRadius: 12,
        }}
      >
        <div
          style={{
            padding: "10px 12px",
            borderBottom: "1px solid rgba(0,0,0,0.12)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 900 }}>{title}</div>
          <button type="button" className="sheet-btn" onClick={onClose}>
            閉じる
          </button>
        </div>
        <div style={{ padding: 12 }}>{children}</div>
      </div>
    </div>
  );
}

export default function SheetHub() {
  const [sheetType, setSheetType] = useState("hero");
  const sheetDef = useMemo(() => SHEETS[sheetType] ?? SHEETS.hero, [sheetType]);

  const [mode, setMode] = useState("view");
  const [catalogOpen, setCatalogOpen] = useState(false);

  const [sheetState, setSheetState] = useState(() => {
    return loadState({ sheetType: "hero" }) ?? SHEETS.hero.defaultState();
  });

  function switchSheet(nextType) {
    const def = SHEETS[nextType];
    if (!def) return;

    setSheetType(nextType);

    const restored = loadState({ sheetType: nextType }) ?? def.defaultState();
    setSheetState(restored);
    setMode("view");
  }

  function handleCreate() {
    if (!isStatefulSheet(sheetDef)) return;
    const s = sheetDef.defaultState();
    setSheetState(s);
    setMode("create");
    saveState(s, { sheetType });
  }

  function handleEdit() {
    if (!isStatefulSheet(sheetDef)) return;
    setMode("edit");
  }

  function handleView() {
    if (!isStatefulSheet(sheetDef)) return;
    setMode("view");
  }

  function handleSaveHistory() {
    if (!isStatefulSheet(sheetDef)) return;
    commitHistory(sheetState, "", sheetType);
    window.dispatchEvent(new Event("rulilura:history-updated"));
  }

  function handleJsonExport() {
    if (!isStatefulSheet(sheetDef)) return;
    exportJson(sheetState, { sheetType });
  }

  async function handleJsonImport() {
    if (!isStatefulSheet(sheetDef)) return;
    const imported = await importJsonViaPicker();
    if (!imported) return;

    setSheetState(imported);
    setMode("edit");
    saveState(imported, { sheetType });
  }

  useEffect(() => {
    const param = readStateParamFromHash();
    const restored = decodeStateFromParam(param);
    if (restored && typeof restored === "object") {
      setSheetType("hero");
      setSheetState(restored);
      saveState(restored, { sheetType: "hero" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleShare() {
    if (!isStatefulSheet(sheetDef)) return;

    const url = buildShareUrl({
      path: sheetDef.path,
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

  const SheetComponent = sheetDef.Component;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, margin: "8px 0", flexWrap: "wrap" }}>
        <button type="button" onClick={handleJsonExport} disabled={!isStatefulSheet(sheetDef)}>
          JSON保存
        </button>
        <button type="button" onClick={handleJsonImport} disabled={!isStatefulSheet(sheetDef)}>
          JSON読み出し
        </button>

        {/* ここが「別シート」じゃなく「モーダルを開く」 */}
        <button type="button" onClick={() => setCatalogOpen(true)}>
          自作データ管理
        </button>

        <span style={{ marginLeft: 8, opacity: 0.7 }}>シート:</span>
        {Object.entries(SHEETS).map(([key, def]) => (
          <button
            key={key}
            type="button"
            onClick={() => switchSheet(key)}
            style={{ fontWeight: key === sheetType ? 700 : 400 }}
          >
            {def.label}
          </button>
        ))}
      </div>

      <SheetComponent
        state={sheetState}
        mode={mode}
        setState={(next) => {
          setSheetState((prev) => {
            const v = typeof next === "function" ? next(prev) : next;
            saveState(v, { sheetType });
            return v;
          });
        }}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onView={handleView}
        onSaveHistory={handleSaveHistory}
        onShare={handleShare}
      />

      {/* モーダルでカタログ */}
      <Modal open={catalogOpen} onClose={() => setCatalogOpen(false)} title="自作データ管理">
        <CatalogSheetFeature />
      </Modal>
    </div>
  );
}
