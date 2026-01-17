// src/data/skillsMaster.js

/**
 * スキルマスター
 * - categories: カテゴリを配列で保持（例: ["戦闘", "近代戦"]）
 * - unlock: そのスキルが一定値に達した時に得られる「推奨/解禁アイテム」など（なければ []）
 *
 * 仕様メモ:
 * - 入力表の「なし」は空配列 [] として扱う
 * - カテゴリー列の「なし」も [] として扱う（=カテゴリ無し）
 */
export const SKILLS_MASTER = [
  { id: 1, name: "接近戦", categories: ["戦闘"], unlock: {
    1: [{ name: "ダガー", qty: 1 }],
    10: [{ name: "ブラスナックル", qty: 1 }],
    20: []
  }},
  { id: 2, name: "剣技", categories: ["戦闘"], unlock: {
    1: [{ name: "ショートソード", qty: 1 }],
    10: [{ name: "ロングソード", qty: 1 }],
    20: [{ name: "カタナ", qty: 1 }]
  }},
  { id: 3, name: "斧／槌戦闘", categories: ["戦闘"], unlock: {
    1: [{ name: "棍棒", qty: 1 }],
    10: [{ name: "アクス", qty: 1 }, { name: "ハンマー", qty: 1 }],
    20: [{ name: "バトルアクス", qty: 1 }]
  }},
  { id: 4, name: "槍／棒術", categories: ["戦闘"], unlock: {
    1: [{ name: "杖（棒）", qty: 1 }],
    10: [{ name: "ショートスピア", qty: 1 }],
    20: [{ name: "ロングスピア", qty: 1 }]
  }},
  { id: 5, name: "盾防御", categories: ["戦闘"], unlock: {
    1: [],
    10: [{ name: "小盾", qty: 1 }],
    20: [{ name: "盾", qty: 1 }]
  }},
  { id: 6, name: "回避", categories: ["戦闘"], unlock: {
    1: [],
    10: [{ name: "部分ヨロイ", qty: 1 }],
    20: [{ name: "皮ヨロイ", qty: 1 }]
  }},
  { id: 7, name: "弓術", categories: ["戦闘"], unlock: {
    1: [{ name: "ショートボウ", qty: 1 }],
    10: [{ name: "クロスボウ", qty: 1 }],
    20: [{ name: "ロングボウ", qty: 1 }]
  }},
  { id: 8, name: "特殊武器", categories: ["戦闘"], unlock: {
    1: [],
    10: [{ name: "ムチ", qty: 1 }],
    20: []
  }},

  { id: 9, name: "拳銃射撃", categories: ["戦闘", "近代戦"], unlock: {
    1: [{ name: "ピストル", qty: 1 }],
    10: [{ name: "マシンピストル", qty: 1 }],
    20: [{ name: "対甲ピストル", qty: 1 }]
  }},
  { id: 10, name: "ライフル射撃", categories: ["戦闘", "近代戦"], unlock: {
    1: [],
    10: [{ name: "ライフル", qty: 1 }],
    20: [{ name: "狙撃銃", qty: 1 }]
  }},
  { id: 11, name: "自動小銃射撃", categories: ["戦闘", "近代戦"], unlock: {
    1: [],
    10: [],
    20: [{ name: "アサルトライフル", qty: 1 }]
  }},
  { id: 12, name: "ロケット／ミサイル", categories: ["戦闘", "近代戦"], unlock: {
    1: [],
    10: [],
    20: [{ name: "対戦車ミサイル", qty: 1 }]
  }},
  { id: 13, name: "キャノン", categories: ["戦闘", "近代戦"], unlock: {
    1: [],
    10: [],
    20: []
  }},
  { id: 14, name: "爆発物", categories: ["戦闘", "近代戦"], unlock: {
    1: [],
    10: [],
    20: [{ name: "手榴弾", qty: 3 }]
  }},
  { id: 15, name: "現世武器知識", categories: ["戦闘", "近代戦", "現世"], unlock: {
    1: [],
    10: [],
    20: []
  }},

  { id: 16, name: "エンジニアリング", categories: ["現世"], unlock: {
    1: [{ name: "工具", qty: 1 }, { name: "奏甲用工具", qty: 1 }],
    10: [],
    20: []
  }},
  { id: 17, name: "メンテナンス", categories: ["現世"], unlock: {
    1: [{ name: "工具", qty: 1 }, { name: "奏甲用工具", qty: 1 }],
    10: [],
    20: []
  }},
  { id: 18, name: "鍛冶/工作", categories: [], unlock: {
    1: [{ name: "工具", qty: 1 }],
    10: [],
    20: []
  }},
  { id: 19, name: "現世知識", categories: ["現世"], unlock: {
    1: [],
    10: [],
    20: []
  }},

  { id: 20, name: "アーカイア知識", categories: ["アーカイア"], unlock: {
    1: [],
    10: [],
    20: []
  }},
  { id: 21, name: "歌術知識", categories: ["アーカイア"], unlock: {
    1: [],
    10: [],
    20: []
  }},
  { id: 22, name: "蟲知識", categories: ["アーカイア"], unlock: {
    1: [],
    10: [],
    20: []
  }},

  { id: 23, name: "偵察", categories: [], unlock: {
    1: [],
    10: [],
    20: [{ name: "双眼鏡", qty: 1 }]
  }},
  { id: 24, name: "隠蔽", categories: [], unlock: {
    1: [],
    10: [],
    20: []
  }},
  { id: 25, name: "盗賊", categories: [], unlock: {
    1: [{ name: "七つ道具", qty: 1 }],
    10: [{ name: "偽造身分証明書", qty: 1 }],
    20: []
  }},
  { id: 26, name: "交渉", categories: [], unlock: {
    1: [],
    10: [],
    20: []
  }},
  { id: 27, name: "恫喝", categories: [], unlock: {
    1: [],
    10: [],
    20: []
  }},
  { id: 28, name: "口説き", categories: [], unlock: {
    1: [],
    10: [],
    20: []
  }},
  { id: 29, name: "救急", categories: [], unlock: {
    1: [{ name: "治療キット", qty: 1 }],
    10: [],
    20: [{ name: "毒消し", qty: 1 }]
  }},
  { id: 30, name: "泳ぎ", categories: [], unlock: {
    1: [],
    10: [],
    20: []
  }},
  { id: 31, name: "料理", categories: [], unlock: {
    1: [{ name: "ナベ・フライパン", qty: 1 }],
    10: [],
    20: []
  }},
  { id: 32, name: "演奏", categories: [], unlock: {
    1: [],
    10: [{ name: "楽器", qty: 1 }],
    20: [{ name: "楽器", qty: 3 }]
  }},
  { id: 33, name: "ギャンブル", categories: [], unlock: {
    1: [{ name: "ダイス（２組）", qty: 1 }],
    10: [],
    20: []
  }},

  { id: 34, name: "鑑定", categories: ["アーカイア"], unlock: {
    1: [{ name: "虫メガネ", qty: 1 }],
    10: [],
    20: []
  }},
  { id: 35, name: "交感", categories: ["アーカイア"], unlock: {
    1: [],
    10: [],
    20: []
  }},
  { id: 36, name: "推理", categories: [], unlock: {
    1: [],
    10: [],
    20: []
  }},
];

// よく参照するID定数
// 回避
export const SKILL_ID_EVADE = 6;
// 歌姫の固定スキル（初期配布）
export const SKILL_ID_ARCHAIA_KNOWLEDGE = 20; // アーカイア知識
export const SKILL_ID_DIVA_ART_KNOWLEDGE = 21; // 歌術知識
export const SKILL_ID_BUG_KNOWLEDGE = 22; // 蟲知識
export const SKILL_ID_HIDE = 24; // 隠蔽
export const SKILL_ID_COOKING = 31; // 料理

// -------- 取得ユーティリティ --------

/** id -> skill */
export function skillById(id) {
  const n = Number(id);
  if (!Number.isFinite(n)) return null;
  return SKILLS_MASTER.find(s => s.id === n) ?? null;
}

/** id -> name（見つからなければ "(unknown)"） */
export function skillNameById(id) {
  return skillById(id)?.name ?? "(unknown)";
}

/** 指定カテゴリを含むスキル一覧 */
export function skillsByCategory(category) {
  return SKILLS_MASTER.filter(s => (s.categories ?? []).includes(category));
}

/**
 * スキル値に応じて解禁アイテムを返す
 * 例: skillUnlocks(2, 12) -> ["ショートソード", "ロングソード"]
 */
export function skillUnlocks(skillId, value) {
  const s = skillById(skillId);
  if (!s) return [];
  const v = Number(value) || 0;
  const res = [];
  if (v >= 1) res.push(...(s.unlock?.[1] ?? []));
  if (v >= 10) res.push(...(s.unlock?.[10] ?? []));
  if (v >= 20) res.push(...(s.unlock?.[20] ?? []));
  // 重複除去
  return Array.from(new Set(res));
}
