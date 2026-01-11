// src/pages/sheets/heroSheet/components/ImeTextarea.jsx
import React, { useEffect, useState } from "react";

export function ImeTextarea({ value, editable, onCommit, minHeight = 120 }) {
  const [local, setLocal] = useState(value ?? "");
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (!isComposing) setLocal(value ?? "");
  }, [value, isComposing]);

  if (!editable) return <div style={{ whiteSpace: "pre-wrap" }}>{value || "—"}</div>;

  const commit = (v) => onCommit?.(v);

  return (
    <textarea
      className="sheet-input"
      style={{ minHeight, resize: "vertical" }}
      value={local}
      onChange={(e) => {
        const v = e.target.value;
        setLocal(v);
        if (!isComposing) commit(v);
      }}
      onCompositionStart={() => setIsComposing(true)}
      onCompositionEnd={(e) => {
        setIsComposing(false);
        commit(e.currentTarget.value);
      }}
      onBlur={(e) => commit(e.currentTarget.value)}
    />
  );
}
