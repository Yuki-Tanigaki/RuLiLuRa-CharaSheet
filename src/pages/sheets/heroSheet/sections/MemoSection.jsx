// src/pages/sheets/heroSheet/sections/MemoSection.jsx
import React from "react";
import { TextCell } from "/src/pages/sheets/components/TextCell.jsx";

export function MemoSection({ model }) {
  const { s, editable, setField } = model;

  return (
    <section className="panel memo">
      <div className="panel-title">メモ</div>

      <TextCell
        editable={!!editable}
        value={s?.memo ?? ""}
        multiline
        minHeight={140}
        placeholder=""
        onCommit={(v) => setField(["memo"], v)}
      />
    </section>
  );
}
