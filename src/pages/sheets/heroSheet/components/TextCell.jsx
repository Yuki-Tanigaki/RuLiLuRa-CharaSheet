// src/pages/sheets/heroSheet/components/TextCell.jsx
import React, { useEffect, useState } from "react";
import { joinClass } from "../heroSheetUtils.js";

export function TextCell({ editable, value, onCommit, placeholder = "—", className = "" }) {
  const [local, setLocal] = useState(value ?? "");
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (!isComposing) setLocal(value ?? "");
  }, [value, isComposing]);

  if (!editable) return <span className={className}>{value || placeholder}</span>;

  return (
    <input
      className={joinClass("sheet-input", className)}
      value={local}
      placeholder={placeholder === "—" ? "" : placeholder}
      onChange={(e) => {
        const v = e.target.value;
        setLocal(v);
        if (!isComposing) onCommit?.(v);
      }}
      onCompositionStart={() => setIsComposing(true)}
      onCompositionEnd={(e) => {
        setIsComposing(false);
        onCommit?.(e.currentTarget.value);
      }}
      onBlur={(e) => onCommit?.(e.currentTarget.value)}
    />
  );
}
