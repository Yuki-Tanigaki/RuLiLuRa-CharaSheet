import { SKILLS_MASTER } from "../data/skillsMaster.js";

export function validateAll(state) {
  const errors = [];

  // abilities
  const a = state.abilities;
  const abilityKeys = ["str", "dex", "agi", "vit", "int", "psy"];
  for (const k of abilityKeys) {
    const v = Number(a[k]);
    if (!Number.isFinite(v)) errors.push(`能力値 ${k} が数値ではありません`);
    if (v < 2 || v > 20) errors.push(`能力値 ${k} は2〜20にしてください`);
  }

  if (a.method === "point") {
    const sum = abilityKeys.reduce((acc, k) => acc + (Number(a[k]) || 0), 0);
    if (sum !== 70) errors.push(`能力値合計が70ではありません（現在: ${sum}）`);
  }

  // skills: 8 selected, distinct
  const selected = state.skills.selected || [];
  const ids = selected.map(s => s.id).filter(id => id != null);

  if (ids.length !== 8) errors.push(`スキルは8つ選択してください（現在: ${ids.length}）`);

  const dup = ids.filter((id, idx) => ids.indexOf(id) !== idx);
  if (dup.length) errors.push(`スキルが重複しています`);

  // skill base points
  const bases = selected.map(s => Number(s.base) || 0);
  const sumBase = bases.reduce((a, b) => a + b, 0);

  if (sumBase !== 80) errors.push(`スキルポイント合計が80ではありません（現在: ${sumBase}）`);

  for (const s of selected) {
    const b = Number(s.base) || 0;
    if (b < 5 || b > 20) errors.push(`スキル値は5〜20（id=${s.id ?? "未選択"}）`);
    if (b % 5 !== 0) errors.push(`スキル値は5刻み（id=${s.id ?? "未選択"}）`);
  }

  // bonus targets rules
  const intMod = (Number(a.int) || 0) - 10;
  const dexMod = (Number(a.dex) || 0) - 10;

  const intTargets = state.skills.intBonusTargets || [];
  const dexTargets = state.skills.dexBonusTargets || [];

  if (intMod > 0 && intTargets.length !== 2) errors.push(`知力ボーナス対象は2つ選択してください`);
  if (intMod <= 0 && intTargets.length !== 0) errors.push(`知力ボーナス対象は知力修正が+のときのみ`);

  if (dexMod > 0 && dexTargets.length !== 2) errors.push(`器用さボーナス対象は2つ選択してください`);
  if (dexMod <= 0 && dexTargets.length !== 0) errors.push(`器用さボーナス対象は器用さ修正が+のときのみ`);

  if (intMod > 0 && dexMod > 0) {
    const all = [...intTargets, ...dexTargets];
    const dup2 = all.filter((id, idx) => all.indexOf(id) !== idx);
    if (dup2.length) errors.push(`知力・器用さボーナスは4つすべて別スキルにしてください`);
  }

  // bonus targets must be among selected
  const idSet = new Set(ids);
  for (const id of intTargets) if (!idSet.has(id)) errors.push(`知力ボーナス対象が選択スキル外です`);
  for (const id of dexTargets) if (!idSet.has(id)) errors.push(`器用さボーナス対象が選択スキル外です`);

  // sanity: id exists in master
  const masterSet = new Set(SKILLS_MASTER.map(s => s.id));
  for (const id of ids) if (!masterSet.has(id)) errors.push(`未知のスキルID: ${id}`);

  return errors;
}
