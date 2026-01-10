export const SKILLS_MASTER = [
  { id: 1, name: "接近戦" },
  { id: 2, name: "剣技" },
  { id: 3, name: "斧／槌戦闘" },
  { id: 4, name: "槍／棒術" },
  { id: 5, name: "盾防御" },
  { id: 6, name: "回避" },
  { id: 7, name: "弓術" },
  { id: 8, name: "特殊武器" },
  { id: 9, name: "拳銃射撃" },
  { id: 10, name: "ライフル射撃" },
  { id: 11, name: "自動小銃射撃" },
  { id: 12, name: "ロケット／ミサイル" },
  { id: 13, name: "キャノン" },
  { id: 14, name: "爆発物" },
  { id: 15, name: "現世武器知識" },
  { id: 16, name: "エンジニアリング" },
  { id: 17, name: "メンテナンス" },
  { id: 18, name: "鍛冶/工作" },
  { id: 19, name: "現世知識" },
  { id: 20, name: "アーカイア知識" },
  { id: 21, name: "歌術知識" },
  { id: 22, name: "蟲知識" },
  { id: 23, name: "偵察" },
  { id: 24, name: "隠蔽" },
  { id: 25, name: "盗賊" },
  { id: 26, name: "交渉" },
  { id: 27, name: "恫喝" },
  { id: 28, name: "口説き" },
  { id: 29, name: "救急" },
  { id: 30, name: "泳ぎ" },
  { id: 31, name: "料理" },
  { id: 32, name: "演奏" },
  { id: 33, name: "ギャンブル" },
  { id: 34, name: "鑑定" },
  { id: 35, name: "交感" },
  { id: 36, name: "推理" }
];

export const SKILL_ID_EVADE = 6;

export function skillNameById(id) {
  const s = SKILLS_MASTER.find(x => x.id === id);
  return s ? s.name : "";
}
