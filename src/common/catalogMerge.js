// src/common/catalogMerge.js

/**
 * master + userCatalog を混ぜて、一覧/参照解決しやすい形に整えるユーティリティ。
 *
 * 前提:
 * - master の id は基本 number（ただし string でも扱える）
 * - userCatalog の各 entry も id を持つ（number/string）
 * - 参照キーは "m:<id>" または "u:<id>" を推奨（衝突回避）
 *
 * 返り値 catalog の主な API:
 * - catalog.list(kind)            => Entry[]
 * - catalog.byKey.get("m:12")     => Entry | undefined
 * - catalog.resolve(kind, ref)    => Entry | null
 * - catalog.keyOf(kind, {source,id}) => "m:12" | "u:999"
 */

export const SOURCE_MASTER = "m";
export const SOURCE_USER = "u";

/** "m:12" / "u:999" を作る */
export function makeCatalogKey(source, id) {
  if (!source) return "";
  if (id === "" || id == null) return "";
  return `${String(source)}:${String(id)}`;
}

/** "m:12" / "u:999" を { source, id } に戻す */
export function parseCatalogKey(key) {
  if (!key || typeof key !== "string") return null;
  const i = key.indexOf(":");
  if (i <= 0) return null;
  const source = key.slice(0, i);
  const idRaw = key.slice(i + 1);
  if (!idRaw) return null;

  // number にできるなら number に寄せる（扱いやすさ優先）
  const n = Number(idRaw);
  const id = Number.isFinite(n) && String(n) === idRaw ? n : idRaw;
  return { source, id };
}

/**
 * entry を内部的に共通の形にする
 * - 元オブジェクトは spread でコピーし、__kind/__source/__key を付与
 */
function normalizeEntry(kind, source, entry, { idField = "id" } = {}) {
  const id = entry?.[idField];
  const key = makeCatalogKey(source, id);
  return {
    ...(entry ?? {}),
    __kind: kind,
    __source: source,
    __key: key,
  };
}

/**
 * masterByKind / userCatalog をマージして catalog を作る
 *
 * @param {Object} args
 * @param {Object<string, Array>} args.mastersByKind
 * @param {Object<string, Array>} args.userCatalog
 * @param {Object<string, Object>} [args.kindMeta] 例: { weapon: { idField:"id", nameField:"name" } }
 * @param {string} [args.defaultIdField="id"]
 * @param {string} [args.defaultNameField="name"]
 * @param {boolean} [args.sort=true] name で並べるか（kindMeta.sortFn があれば優先）
 */
export function mergeCatalog({
  mastersByKind = {},
  userCatalog = {},
  kindMeta = {},
  defaultIdField = "id",
  defaultNameField = "name",
  sort = true,
} = {}) {
  const byKey = new Map(); // key -> normalized entry
  const byKind = {}; // kind -> normalized entries

  // kind の集合（master / user 両方から拾う）
  const kindSet = new Set([
    ...Object.keys(mastersByKind || {}),
    ...Object.keys(userCatalog || {}),
  ]);

  for (const kind of kindSet) {
    const meta = kindMeta?.[kind] ?? {};
    const idField = meta.idField ?? defaultIdField;

    const masters = Array.isArray(mastersByKind?.[kind]) ? mastersByKind[kind] : [];
    const users = Array.isArray(userCatalog?.[kind]) ? userCatalog[kind] : [];

    // 先に master、後に user（ただし key が違うので衝突しない）
    const rows = [];

    for (const m of masters) {
      const e = normalizeEntry(kind, SOURCE_MASTER, m, { idField });
      if (e.__key) {
        byKey.set(e.__key, e);
        rows.push(e);
      }
    }

    for (const u of users) {
      const e = normalizeEntry(kind, SOURCE_USER, u, { idField });
      if (e.__key) {
        byKey.set(e.__key, e);
        rows.push(e);
      }
    }

    // 並び順（任意）
    if (sort && rows.length) {
      const sortFn =
        typeof meta.sortFn === "function"
          ? meta.sortFn
          : (a, b) => {
              const nameField = meta.nameField ?? defaultNameField;
              const an = String(a?.[nameField] ?? "");
              const bn = String(b?.[nameField] ?? "");
              return an.localeCompare(bn, "ja");
            };
      rows.sort(sortFn);
    }

    byKind[kind] = rows;
  }

  function list(kind) {
    return Array.isArray(byKind?.[kind]) ? byKind[kind] : [];
  }

  function keyOf(kind, ref) {
    // ref がすでに "m:12" 形式
    if (typeof ref === "string") return ref;

    // ref = { source, id } or { __source, id } or { id, source }
    const source = ref?.source ?? ref?.__source ?? null;
    const id = ref?.id ?? ref?.[ (kindMeta?.[kind]?.idField ?? defaultIdField) ] ?? null;
    return makeCatalogKey(source, id);
  }

  /**
   * kind と ref から entry を引く
   * ref 例:
   * - "m:12" / "u:999"
   * - { source:"m", id:12 }
   * - { __source:"u", id:999 }
   * - { id:12 } (source 省略時は master→user の順に探索)
   */
  function resolve(kind, ref) {
    if (ref == null || ref === "") return null;

    // 文字列キー
    if (typeof ref === "string") {
      const hit = byKey.get(ref);
      return hit ?? null;
    }

    // オブジェクト
    const source = ref?.source ?? ref?.__source ?? null;
    const idField = (kindMeta?.[kind]?.idField ?? defaultIdField);
    const id = ref?.id ?? ref?.[idField] ?? null;

    if (source) {
      const k = makeCatalogKey(source, id);
      return (k && byKey.get(k)) ?? null;
    }

    // source 無し → master 優先で探索
    const km = makeCatalogKey(SOURCE_MASTER, id);
    const ku = makeCatalogKey(SOURCE_USER, id);
    return byKey.get(km) ?? byKey.get(ku) ?? null;
  }

  function labelOf(kind, entryOrRef) {
    const meta = kindMeta?.[kind] ?? {};
    const nameField = meta.nameField ?? defaultNameField;

    const e =
      entryOrRef && entryOrRef.__key
        ? entryOrRef
        : resolve(kind, entryOrRef);

    const v = e?.[nameField];
    return v == null || String(v).trim() === "" ? "—" : String(v);
  }

  return {
    // raw
    byKey,
    byKind,

    // helpers
    list,
    resolve,
    keyOf,
    labelOf,

    // key utils
    makeKey: makeCatalogKey,
    parseKey: parseCatalogKey,

    // const
    SOURCE_MASTER,
    SOURCE_USER,
  };
}
