// src/pages/SheetHub.jsx
import React, { useEffect, useMemo, useState } from "react";

import HeroSheet from "./sheets/heroSheet/HeroSheet.jsx";
import { defaultHeroState } from "./sheets/heroSheet/defaultHeroState.js";
// import DivaSheet from "./sheets/divaSheet/DivaSheet.jsx";
// import { defaultDivaState } from "./sheets/divaSheet/defaultDivaState.js";
// import RarmSheet from "./sheets/rarmSheet/RarmSheet.jsx";
// import { defaultRarmState } from "./sheets/rarmSheet/defaultRarmState.js";
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
  // diva: {
  //   label: "歌姫",
  //   path: "/sheets/diva",
  //   kind: "stateful",
  //   Component: DivaSheet,
  //   defaultState: defaultDivaState,
  // },
  // rarm: {
  //   label: "奏甲",
  //   path: "/sheets/rarm",
  //   kind: "stateful",
  //   Component: RarmSheet,
  //   defaultState: defaultRarmState,
  // },
  catalog: {
    label: "カタログ",
    path: "/sheets/catalog",
    kind: "stateless",
    Component: CatalogSheet,
  },
};

function isStatefulSheet(def) {
  return (def?.kind ?? "stateful") === "stateful";
}

/** CatalogSheet は state を持たないので Hub 側で model を作って渡す */
function CatalogSheetFeature() {
  // 全シート共通の独自DB
  const model = useCatalogSheetModel({ scope: "shared", editable: true });
  return <CatalogSheet model={model} />;
}

export default function SheetHub() {
  const [sheetType, setSheetType] = useState("hero");
  const sheetDef = useMemo(() => SHEETS[sheetType] ?? SHEETS.hero, [sheetType]);

  const [mode, setMode] = useState("view"); // "view" | "edit" | "create"

  const [sheetState, setSheetState] = useState(() => {
    // 初回は hero のローカル復元（なければデフォルト）
    return loadState({ sheetType: "hero" }) ?? SHEETS.hero.defaultState();
  });

  function switchSheet(nextType) {
    const def = SHEETS[nextType];
    if (!def) return;

    setSheetType(nextType);

    // stateless は state を触らない
    if (!isStatefulSheet(def)) {
      setMode("view");
      return;
    }

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

  // 初回：URLから復元（hash）
  useEffect(() => {
    const param = readStateParamFromHash();
    const restored = decodeStateFromParam(param);
    if (restored && typeof restored === "object") {
      // 共有URLはキャラstate前提なので hero に流し込む
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
  const isCatalog = sheetType === "catalog";

  return (
    <div>
      {/* 上部ボタン列 */}
      <div style={{ display: "flex", gap: 8, margin: "8px 0", flexWrap: "wrap" }}>
        {/* JSON（stateful のみ） */}
        <button type="button" onClick={handleJsonExport} disabled={!isStatefulSheet(sheetDef)}>
          JSON保存
        </button>
        <button type="button" onClick={handleJsonImport} disabled={!isStatefulSheet(sheetDef)}>
          JSON読み出し
        </button>

        {/* 自作データ */}
        <button type="button" onClick={() => switchSheet("catalog")}>
          自作データ管理
        </button>

        {/* シート切替 */}
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

      {isCatalog ? (
        <CatalogSheetFeature />
      ) : (
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
      )}
    </div>
  );
}
