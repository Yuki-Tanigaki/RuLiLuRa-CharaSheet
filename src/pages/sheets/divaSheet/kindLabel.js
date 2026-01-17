// src/pages/sheets/divaSheet/kindLabel.js

/* -----------------------------
 * UIにおける kind → 日本語ラベル変換
 * ----------------------------- */
export function kindLabel(kind) {
  switch (kind) {
    case "weapon": return "武器";
    case "armor": return "防具";
    case "shield": return "盾";
    case "tool": return "道具";
    case "skill": return "技能";
    case "heroSkill": return "英雄特技";
    default: return kind || "—";
  }
}