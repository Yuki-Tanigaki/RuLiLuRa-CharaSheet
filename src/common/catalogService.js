// src/common/catalogService.js

function isPlainObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function asTrimmedString(v) {
  if (v == null) return "";
  return String(v).trim();
}

function toFiniteNumberOrNull(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * userCatalog のカテゴリデータを配列として取り出す。
 * - 想定1: userCatalog[key] = [{...}, ...]
 * - 想定2: userCatalog[key] = { list: [{...}, ...] }
 */
function getUserList(userCatalog, key) {
  const raw = userCatalog?.[key];
  if (Array.isArray(raw)) return raw;
  if (isPlainObject(raw) && Array.isArray(raw.list)) return raw.list;
  return [];
}

/**
 * user row を最低限正規化（UIでは文字列のままでもOKだが、ここで最低限整える）
 * - id は number 化（できなければ null）
 * - name は trim
 */
function normalizeUserRow(row, { idField, nameField }) {
  const r0 = isPlainObject(row) ? row : {};
  const out = { ...r0 };

  // id/name を最低限整える（他のフィールドはそのまま）
  const id = toFiniteNumberOrNull(out[idField]);
  const name = asTrimmedString(out[nameField]);

  out[idField] = id; // null のままでもよい（validate で拾う）
  out[nameField] = name;

  return out;
}

/**
 * userCatalog の整合性検証（表示用：保存禁止にはしない）
 * - id重複 / name重複（user内）
 * - id無効 / name空
 */
function validateUserCategoryInternal(masterCat, userList) {
  const { key: categoryKey, label, idField, nameField } = masterCat;

  const errors = [];
  const warnings = [];

  const seenId = new Map(); // id -> index
  const seenName = new Map(); // name -> index

  for (let i = 0; i < userList.length; i++) {
    const row = normalizeUserRow(userList[i], { idField, nameField });

    const id = row[idField];
    const name = row[nameField];

    if (id == null) {
      errors.push({
        code: "USER_ID_INVALID",
        categoryKey,
        index: i,
        message: `[${label}] user row#${i}: invalid ${idField}`,
      });
    } else {
      if (seenId.has(id)) {
        errors.push({
          code: "USER_ID_DUPLICATED",
          categoryKey,
          index: i,
          message: `[${label}] duplicated ${idField} in user: ${id} (row#${seenId.get(id)} and row#${i})`,
        });
      } else {
        seenId.set(id, i);
      }
    }

    if (!name) {
      errors.push({
        code: "USER_NAME_EMPTY",
        categoryKey,
        index: i,
        message: `[${label}] user row#${i}: empty ${nameField}`,
      });
    } else {
      if (seenName.has(name)) {
        errors.push({
          code: "USER_NAME_DUPLICATED",
          categoryKey,
          index: i,
          message: `[${label}] duplicated ${nameField} in user: ${JSON.stringify(name)} (row#${seenName.get(
            name
          )} and row#${i})`,
        });
      } else {
        seenName.set(name, i);
      }
    }
  }

  return { errors, warnings };
}

/**
 * master + user を合成
 * - ルール: 同一 id は user が上書き（override）
 * - user のみの項目も末尾に追加
 * - 返り値: { list, byId(Map), byName(Map) }
 */
function mergeCategoryInternal(masterCat, userListRaw) {
  const { idField, nameField } = masterCat;

  const userList = userListRaw.map((r) => normalizeUserRow(r, { idField, nameField }));

  const byId = new Map();
  const byName = new Map();
  const list = [];

  // 1) master をベースに投入
  for (const m of masterCat.list) {
    const id = m[idField];
    const name = m[nameField];
    byId.set(id, m);
    byName.set(name, m);
    list.push(m);
  }

  // 2) user で override / 追加
  for (const u of userList) {
    const id = u[idField];
    const name = u[nameField];

    // id が無効なものは merge では扱わない（validate でエラー表示する）
    if (id == null) continue;

    const existing = byId.get(id);

    if (existing) {
      // override：list の該当要素を差し替え
      const idx = list.findIndex((x) => x?.[idField] === id);
      if (idx >= 0) list[idx] = u;
    } else {
      // 追加：末尾
      list.push(u);
    }

    byId.set(id, u);

    // name map は「最後に入ったもの」が勝つ（重複は validate で検出）
    if (name) byName.set(name, u);
  }

  return { list, byId, byName };
}

/**
 * 次に使える user id を返す（整数）
 * - master と user の最大 id + 1
 */
function nextUserIdInternal(masterCat, userListRaw) {
  const { idField, nameField } = masterCat;
  let maxId = -1;

  for (const r of masterCat.list) {
    const id = toFiniteNumberOrNull(r?.[idField]);
    if (id != null) maxId = Math.max(maxId, Math.trunc(id));
  }

  for (const r0 of userListRaw) {
    const r = normalizeUserRow(r0, { idField, nameField });
    const id = r[idField];
    if (id != null) maxId = Math.max(maxId, Math.trunc(id));
  }

  return maxId + 1;
}

/**
 * master との差分（表示用途）
 * - user が override している id
 * - user のみの追加 id
 */
function diffFromMasterInternal(masterCat, userListRaw) {
  const { idField, nameField } = masterCat;
  const masterById = new Map(masterCat.list.map((x) => [x[idField], x]));

  const overrides = [];
  const additions = [];
  const invalid = [];

  for (let i = 0; i < userListRaw.length; i++) {
    const u = normalizeUserRow(userListRaw[i], { idField, nameField });
    const id = u[idField];
    if (id == null) {
      invalid.push({ index: i, row: u });
      continue;
    }
    if (masterById.has(id)) overrides.push({ id, master: masterById.get(id), user: u });
    else additions.push({ id, user: u });
  }

  return { overrides, additions, invalid };
}

/**
 * Public API
 */
export function createCatalogService({ masterCatalogs, userCatalog }) {
  if (!masterCatalogs) throw new Error("createCatalogService: masterCatalogs is required");

  // 合成済みをカテゴリごとにキャッシュ（service生成時に確定）
  const mergedCache = {};
  const validateCache = {};
  const diffCache = {};

  const keys = Object.keys(masterCatalogs);

  for (const key of keys) {
    const masterCat = masterCatalogs[key];
    const userList = getUserList(userCatalog, key);

    mergedCache[key] = mergeCategoryInternal(masterCat, userList);
    validateCache[key] = validateUserCategoryInternal(masterCat, userList);
    diffCache[key] = diffFromMasterInternal(masterCat, userList);
  }

  function mustGetMaster(key) {
    const cat = masterCatalogs[key];
    if (!cat) throw new Error(`Unknown categoryKey: ${key}`);
    return cat;
  }

  return {
    /** masterカテゴリ定義（不変） */
    getCategory(key) {
      return mustGetMaster(key);
    },

    /** 合成済みlist */
    getMergedList(key) {
      mustGetMaster(key);
      return mergedCache[key]?.list ?? [];
    },

    /** 合成済み byId */
    getById(key, id) {
      mustGetMaster(key);
      return mergedCache[key]?.byId?.get(Number(id)) ?? null;
    },

    /** 合成済み byName */
    getByName(key, name) {
      mustGetMaster(key);
      const s = asTrimmedString(name);
      if (!s) return null;
      return mergedCache[key]?.byName?.get(s) ?? null;
    },

    /** userカテゴリの検証結果（S5: 更新ごとにUIが呼ぶ想定） */
    validateUserCategory(key) {
      mustGetMaster(key);
      return validateCache[key] ?? { errors: [], warnings: [] };
    },

    /** masterとの差分（UI表示用途） */
    diffFromMaster(key) {
      mustGetMaster(key);
      return diffCache[key] ?? { overrides: [], additions: [], invalid: [] };
    },

    /** 新規追加用の次ID（S5: nextUserId を使う） */
    nextUserId(key) {
      const masterCat = mustGetMaster(key);
      const userList = getUserList(userCatalog, key);
      return nextUserIdInternal(masterCat, userList);
    },

    listCategoryKeys() {
      return Object.keys(masterCatalogs ?? {});
    },
  };
}
