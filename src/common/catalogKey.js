// src/common/catalogKey.js
export function encodeCatalogKey(categoryKey, id) {
  const k = String(categoryKey ?? "").trim();
  const n = Number(id);
  if (!k || !Number.isFinite(n)) return "";
  return `${k}:${n}`;
}

export function decodeCatalogKey(key) {
  const [categoryKey, idStr] = String(key ?? "").split(":");
  const id = Number(idStr);
  if (!categoryKey || !Number.isFinite(id)) return null;
  return { categoryKey, id };
}
