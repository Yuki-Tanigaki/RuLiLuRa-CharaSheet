// src/pages/sheets/components/NumCell.jsx
import React from "react";
import { clamp, safeNum, toNumOrNull } from "/src/common/utils/number.js";
import { joinClass } from "/src/common/utils/format.js";

function showNum(v) {
  const x = toNumOrNull(v);
  return x === null ? "—" : x;
}

export function NumCell({ editable, value, onCommit, min = 0, max = 9999, className = "" }) {
  if (!editable) return <span className={className}>{showNum(value)}</span>;

  return (
    <input
      className={joinClass("sheet-input", className)}
      type="number"
      min={min}
      max={max}
      value={safeNum(value, min)}
      onChange={(e) => onCommit?.(clamp(e.target.value, min, max))}
    />
  );
}
