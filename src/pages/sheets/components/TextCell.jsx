// src/pages/sheets/heroSheet/components/TextCell.jsx
import React, { useEffect, useState } from "react";
import { joinClass } from "../common/utils/format.js";

export function TextCell({
  editable,
  value,
  onCommit,
  placeholder = "—",
  className = "",
  multiline = false,
  minHeight = 120,
}) {
  const [local, setLocal] = useState(value ?? "");
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (!isComposing) setLocal(value ?? "");
  }, [value, isComposing]);

  // 表示（read-only）
  if (!editable) {
    if (multiline) {
      return (
        <div className={className} style={{ whiteSpace: "pre-wrap" }}>
          {value || placeholder}
        </div>
      );
    }
    return <span className={className}>{value || placeholder}</span>;
  }

  const commit = (v) => onCommit?.(v);

  // 入力（editable）
  if (multiline) {
    return (
      <textarea
        className={joinClass("sheet-input", className)}
        style={{ minHeight, resize: "vertical" }}
        value={local}
        placeholder={placeholder === "—" ? "" : placeholder}
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

  return (
    <input
      className={joinClass("sheet-input", className)}
      value={local}
      placeholder={placeholder === "—" ? "" : placeholder}
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
