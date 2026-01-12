/**
 * 英雄スキルマスター
 *
 */
export const DIVA_SKILLS_MASTER = [
  { id: 1, name: "能力アップ" },
  { id: 2, name: "スキルＵＰ" },
  { id: 3, name: "十八番（おはこ）" },
  { id: 4, name: "インテリ" },
  { id: 5, name: "成長ボーナス×" },
  { id: 6, name: "根性４" },
  { id: 7, name: "騎士【筋力】15＋" },
  { id: 8, name: "寄生蟲バスター《蟲知識》10＋" },
  { id: 9, name: "局地戦エキスパート—" },
  { id: 10, name: "対空戦闘エキスパート—" },
  { id: 11, name: "水中戦闘エキスパート《泳ぎ》15＋" },
  { id: 12, name: "強打【筋力】11＋" },
  { id: 13, name: "渾身の一撃４" },
  { id: 14, name: "集中攻撃Ⅰ" },
  { id: 15, name: "集中攻撃Ⅱ" },
  { id: 16, name: "二挺射撃（個人戦闘）" },
  { id: 17, name: "二挺射撃（奏甲戦闘）" },
  { id: 18, name: "二挺射撃（大型武器）" },
  { id: 19, name: "全力射８" },
  { id: 20, name: "奏甲猟兵Ⅰ" },
  { id: 21, name: "奏甲猟兵Ⅱ" },
  { id: 22, name: "奏甲回避Ⅰ" },
  { id: 23, name: "奏甲回避Ⅱ" },
  { id: 24, name: "緊急射撃" },
  { id: 25, name: "武器エキスパート" },
  { id: 26, name: "圧倒" },
  { id: 27, name: "機先" },
  { id: 28, name: "オーラ" },
  { id: 29, name: "見切り" },
  { id: 30, name: "致命的一撃" },
  { id: 31, name: "スナイパー" },
  { id: 32, name: "ピンポイント攻撃" },
  { id: 33, name: "レンジャー" },
  { id: 34, name: "受け流し" },
  { id: 35, name: "身代わり" },
  { id: 36, name: "愛機" },
  { id: 37, name: "幻糸抵抗力" },
  { id: 38, name: "耐性" },
  { id: 39, name: "奇跡的回避" },
  { id: 40, name: "幸運" },
  { id: 41, name: "ダイハード" },
  { id: 42, name: "執念" },
  { id: 43, name: "ＭＰの驚異的回復" },
  { id: 44, name: "主人公" },
  { id: 45, name: "精神集中" },
  { id: 46, name: "ＭＰ増加" },
  { id: 47, name: "歌姫強化" },
  { id: 48, name: "ユニゾン" },
  { id: 49, name: "外道／鬼畜系英雄" },
  { id: 50, name: "懇願" },
  { id: 51, name: "絆レベルアップ" },
  { id: 52, name: "応急修理" },
  { id: 53, name: "チューンの天才" },
  { id: 54, name: "整備の天才" },
];

// -------- 取得ユーティリティ --------

/** id -> skill */
export function divaSkillById(id) {
  const n = Number(id);
  if (!Number.isFinite(n)) return null;
  return DIVA_SKILLS_MASTER.find(s => s.id === n) ?? null;
}

/** id -> name（見つからなければ "(unknown)"） */
export function divaSkillNameById(id) {
  return divaSkillById(id)?.name ?? "(unknown)";
}