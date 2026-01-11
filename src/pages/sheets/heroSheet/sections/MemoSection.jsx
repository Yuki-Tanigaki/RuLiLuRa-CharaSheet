// src/pages/sheets/heroSheet/sections/MemoSection.jsx
import React from "react";
import { ImeTextarea } from "../components/ImeTextarea.jsx";

export function MemoSection({ model }) {
  const { s, editable, setField } = model;

  return (
    <section className="panel memo">
      <div className="panel-title">メモ</div>

      <ImeTextarea
        value={s?.memo ?? ""}
        editable={!!editable}
        minHeight={140}
        onCommit={(v) => setField(["memo"], v)}
      />
    </section>
  );
}
