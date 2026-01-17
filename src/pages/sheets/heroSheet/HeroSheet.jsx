// src/pages/sheets/heroSheet/HeroSheet.jsx
import React from "react";
import "../../../styles/hero_sheet.css";

import { defaultHeroState } from "./defaultHeroState.js";
import { useHeroSheetModel } from "./useHeroSheetModel.js";

import { HeaderSection } from "./sections/HeaderSection.jsx";
import { SkillsSection } from "./sections/SkillsSection.jsx";
import { HeroSkillsSection } from "./sections/HeroSkillsSection.jsx";
import { ItemsSection } from "./sections/ItemsSection.jsx";
import { SideEquipmentSection } from "./sections/SideEquipmentSection.jsx";
import { MemoSection } from "./sections/MemoSection.jsx";
import { HistorySection } from "./sections/HistorySection.jsx";

export default function HeroSheet(props) {
  const {
    state,
    mode = "view",
    setState,
    children,
    onCreate,
    onEdit,
    onView,
    onSaveHistory,
    onShare,
  } = props;

  const s = state ?? defaultHeroState();
  const m = useHeroSheetModel({ state: s, mode, setState });
  const editable = !!m.editable;

  const isCreateMode = mode === "create";

  function handleCreateOrDone() {
    // create中：作成完了 → viewへ
    if (isCreateMode) {
      onView?.();
      return;
    }

    // view/edit中：新規作成（確認付き）
    if (!onCreate) return;
    const ok = window.confirm("新規作成を開始します。\n現在のデータは消えますがよろしいですか？");
    if (!ok) return;
    onCreate();
  }

  const createBtnLabel = isCreateMode ? "作成完了" : "新規作成";
  const createBtnDisabled = isCreateMode ? !onView : !onCreate;

  return (
    <div className="page sheet hero-sheet">
      {/* Toolbar */}
      <div
        className="toolbar"
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <button type="button" className="sheet-btn" onClick={onView} disabled={!onView || mode === "view"}>
          閲覧
        </button>

        <button type="button" className="sheet-btn" onClick={onEdit} disabled={!onEdit || mode === "edit"}>
          編集
        </button>

        <button
          type="button"
          className="sheet-btn"
          onClick={handleCreateOrDone}
          disabled={createBtnDisabled}
          title={isCreateMode ? "作成を完了して閲覧モードへ" : "現在のデータを破棄して新規作成します"}
        >
          {createBtnLabel}
        </button>

        <span style={{ flex: 1 }} />

        <button type="button" className="sheet-btn" onClick={onSaveHistory} disabled={!onSaveHistory}>
          履歴に保存
        </button>
        <button type="button" className="sheet-btn" onClick={onShare} disabled={!onShare}>
          共有URLをコピー
        </button>

        <span style={{ opacity: 0.7, fontSize: 12 }}>
          mode: <b>{mode}</b> / editable: <b>{String(editable)}</b>
        </span>
      </div>

      {/* Layout */}
      <div className="sheet-layout">
        <div className="sheet-scroll paper-scroll">
          <div className="paper">
            <HeaderSection model={m}>{children}</HeaderSection>

            <div className="grid-bottom">
              <SkillsSection model={m} />
              <HeroSkillsSection model={m} />
              <ItemsSection model={m} />
            </div>

            <div className="footer-meta">ver {m?.s?.version ?? s.version}</div>
          </div>
        </div>

        <div className="sheet-scroll side-scroll">
          <SideEquipmentSection model={m} />
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            <MemoSection model={m} />
            <HistorySection sheetType="hero" onRestoreState={setState} />
          </div>
        </div>
      </div>
    </div>
  );
}
