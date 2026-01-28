// src/pages/SheetHub.jsx
import React, { useMemo, useState } from "react";

// 英雄シート
import HeroSheet from "./sheets/heroSheet/HeroSheet.jsx";
import { defaultHeroState } from "./sheets/heroSheet/defaultHeroState.js";

// 持ち物シート
import InventorySheet from "./sheets/inventorySheet/InventorySheet.jsx";
import { defaultInventoryState } from "./sheets/inventorySheet/defaultInventoryState.js";

// 自作データ管理
import CatalogSheet from "./sheets/catalogSheet/CatalogSheet.jsx";

/**
 * 旧SheetHubの「SHEETS」相当。
 * - stateful の扱いは残しておく（後でJSON/Share/Historyを戻しやすい）
 */
const SHEETS = {
  hero: {
    label: "英雄シート",
    path: "/sheets/hero",
    kind: "stateful",
    Component: HeroSheet,
    defaultState: defaultHeroState,
  },
  inventory: {
    label: "持ち物シート",
    path: "/sheets/inventory",
    kind: "stateful",
    Component: InventorySheet,
    defaultState: defaultInventoryState,
  },
  // diva / rarm などは後で追加
};

function isStatefulSheet(def) {
  return (def?.kind ?? "stateful") === "stateful";
}

/** 最小モーダル（背景クリックで閉じる / 閉じるボタン / サイズ制限 / スクロール） */
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

/**
 * SheetHub
 * - App から userCatalog / setUserCatalog を受け取る
 * - CatalogSheet はモーダルで常時開ける
 * - sharedState（英雄/持ち物などシート横断の共有データ）
 */
export default function SheetHub({ userCatalog, setUserCatalog }) {
  const [sheetType, setSheetType] = useState("hero");
  const sheetDef = useMemo(() => SHEETS[sheetType] ?? SHEETS.hero, [sheetType]);
  const [mode, setMode] = useState("view");

  // モーダル開閉
  const [catalogOpen, setCatalogOpen] = useState(false);

  // シート状態
  const [sheetState, setSheetState] = useState(() => {
    try {
      return sheetDef.defaultState?.() ?? {};
    } catch {
      return {};
    }
  });

  // 共有ステート（シート横断）
  const [sharedState, setSharedState] = useState(() => {
    try {
      return {
        inventory: defaultInventoryState?.() ?? { items: [] },
      };
    } catch {
      return { inventory: { items: [] } };
    }
  });

  // shared 更新ヘルパ（関数/値どちらもOK）
  const setShared = (next) => {
    setSharedState((prev) => (typeof next === "function" ? next(prev) : next));
  };

  function switchSheet(nextType) {
    const def = SHEETS[nextType];
    if (!def) return;

    setSheetType(nextType);

    let restored = {};
    try {
      restored = def.defaultState?.() ?? {};
    } catch {
      restored = {};
    }

    setSheetState(restored);
    setMode("view");
  }

  function handleCreate() {
    if (!isStatefulSheet(sheetDef)) return;
    const s = sheetDef.defaultState?.() ?? {};
    setSheetState(s);
    setMode("create");
  }

  function handleEdit() {
    if (!isStatefulSheet(sheetDef)) return;
    setMode("edit");
  }

  function handleView() {
    if (!isStatefulSheet(sheetDef)) return;
    setMode("view");
  }

  // 旧版の共通操作は “枠だけ”残す（必要になったら実装を差し戻す）
  function handleJsonExport() {
    alert("TODO: JSON保存（まだ未実装）");
  }

  async function handleJsonImport() {
    alert("TODO: JSON読み出し（まだ未実装）");
  }

  async function handleShare() {
    alert("TODO: 共有URL（まだ未実装）");
  }

  function handleSaveHistory() {
    alert("TODO: 履歴保存（まだ未実装）");
  }

  const SheetComponent = sheetDef.Component;

  // シート更新は今は単純に反映（永続化はしない）
  const setState = (next) => {
    setSheetState((prev) => (typeof next === "function" ? next(prev) : next));
  };

  return (
    <div>
      {/* 上部ツールバー */}
      <div style={{ display: "flex", gap: 8, margin: "8px 0", flexWrap: "wrap" }}>
        <button type="button" onClick={handleJsonExport} disabled={!isStatefulSheet(sheetDef)}>
          JSON保存
        </button>
        <button type="button" onClick={handleJsonImport} disabled={!isStatefulSheet(sheetDef)}>
          JSON読み出し
        </button>

        {/* いつでも開ける：モーダル */}
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

      {/* シート本体 */}
      <SheetComponent
        state={sheetState}
        mode={mode}
        setState={setState}
        shared={sharedState}
        setShared={setShared}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onView={handleView}
        onSaveHistory={handleSaveHistory}
        onShare={handleShare}
      />

      {/* 自作データ管理モーダル */}
      <Modal open={catalogOpen} onClose={() => setCatalogOpen(false)} title="自作データ管理">
        <CatalogSheet userCatalog={userCatalog} setUserCatalog={setUserCatalog} />
      </Modal>
    </div>
  );
}
