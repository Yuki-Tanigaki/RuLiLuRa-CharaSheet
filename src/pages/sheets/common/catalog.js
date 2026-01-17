// src/pages/sheets/common/catalog.js

/**
 * kind + id を一意キー化（inventory / unlock / picks で共通に使う）
 * - id は number / string どちらでもOK（内部は String に寄せる）
 */
export function catalogKeyOf(kind, id) {
  const k = String(kind ?? "").trim();
  const v = id == null ? "" : String(id).trim();
  return k && v ? `${k}:${v}` : "";
}

/**
 * catalog 内の定義（マスター＋ユーザー）を kind+id で引く
 * catalog の各要素は最低限 { kind, id } を想定。
 */
export function defByKindId(catalog, kind, id) {
  const k = String(kind ?? "").trim();
  const v = id == null ? "" : String(id).trim();
  if (!k || !v) return null;

  const list = Array.isArray(catalog) ? catalog : [];
  return list.find((c) => String(c?.kind ?? "") === k && String(c?.id ?? "") === v) ?? null;
}

/**
 * 「参照っぽい入力」を catalog の実在エントリに解決する
 *
 * 対応する入力例：
 * - { kind:"item", id: 3 }
 * - { kind:"item", id:"u_item_xxx" }
 * - { id: 3, kind:"item" }
 * - "item:3"（catalogKey 形式）
 * - 3（defaultKind を渡した場合のみ）
 * - "3"（defaultKind を渡した場合のみ）
 * - { name:"毛布", kind:"item" }（name検索）
 * - "毛布"（defaultKind を渡した場合は name検索もする）
 *
 * options:
 * - defaultKind: kind が省略されたときに補う（例: "item"）
 * - nameKeys: 名前フィールド候補（デフォ: ["name","label","title"]）
 */
export function resolveCatalogRef(ref, catalog, options = {}) {
  const list = Array.isArray(catalog) ? catalog : [];
  const defaultKind = String(options.defaultKind ?? "").trim() || null;
  const nameKeys = Array.isArray(options.nameKeys) && options.nameKeys.length ? options.nameKeys : ["name", "label", "title"];

  if (ref == null) return null;

  // 1) 文字列 "kind:id"（catalogKey）を最優先で解決
  if (typeof ref === "string") {
    const s = ref.trim();
    if (!s) return null;

    const m = s.match(/^([a-zA-Z_]+)\s*:\s*(.+)$/);
    if (m) {
      const k = m[1].trim();
      const idStr = m[2].trim();
      const hit = defByKindId(list, k, idStr);
      return hit ?? null;
    }
  }

  // 2) オブジェクト {kind,id} / {kind,name} / {id} / {name}
  if (typeof ref === "object") {
    const k = String(ref.kind ?? ref.type ?? "").trim() || defaultKind;
    const idVal = ref.id ?? ref.itemId ?? ref.weaponId ?? ref.armorId ?? ref.shieldId ?? null;

    // 2-a) kind+id が取れるならそれで確定
    if (k && idVal != null && String(idVal).trim() !== "") {
      const hit = defByKindId(list, k, idVal);
      if (hit) return hit;
    }

    // 2-b) name で探す（kind があるなら kind で絞る）
    const nameVal = ref.name ?? ref.label ?? ref.title ?? ref.skillName ?? null;
    const name = nameVal == null ? "" : String(nameVal).trim();
    if (name) {
      const cand = list.filter((c) => (k ? String(c?.kind ?? "") === k : true));
      const hit =
        cand.find((c) => nameKeys.some((nk) => String(c?.[nk] ?? "").trim() === name)) ??
        cand.find((c) => nameKeys.some((nk) => String(c?.[nk] ?? "").trim().toLowerCase() === name.toLowerCase())) ??
        null;
      if (hit) return hit;
    }

    return null;
  }

  // 3) 数値 or 数値文字列：defaultKind がある場合のみ id として解決
  const asId = typeof ref === "number" ? String(ref) : typeof ref === "string" ? ref.trim() : "";
  if (defaultKind && asId) {
    const byId = defByKindId(list, defaultKind, asId);
    if (byId) return byId;

    // 4) defaultKind がある場合、文字列は name としても解決を試す
    if (typeof ref === "string") {
      const name = ref.trim();
      if (name) {
        const cand = list.filter((c) => String(c?.kind ?? "") === defaultKind);
        const byName =
          cand.find((c) => nameKeys.some((nk) => String(c?.[nk] ?? "").trim() === name)) ??
          cand.find((c) => nameKeys.some((nk) => String(c?.[nk] ?? "").trim().toLowerCase() === name.toLowerCase())) ??
          null;
        if (byName) return byName;
      }
    }
  }

  return null;
}
