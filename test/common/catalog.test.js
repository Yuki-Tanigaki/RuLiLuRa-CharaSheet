import { describe, it, expect } from "vitest";

// 実データ（既存）をテスト側でも読む
import registry from "@/../data/registry.json";

// テスト対象（あなたが直したやつ）
import { getMasters, all, byId, byName, nameById } from "@/common/catalog.js";

function isFiniteNumber(x) {
  return typeof x === "number" && Number.isFinite(x);
}

describe("catalog.js smoke test (load existing /data masters)", () => {
  it("registry has categories", () => {
    const cats = registry?.categories ?? {};
    expect(Object.keys(cats).length).toBeGreaterThan(0);
  });

  it("every category in registry can be built (source JSON is resolvable via glob)", () => {
    const cats = registry?.categories ?? {};

    for (const [categoryKey, catDef] of Object.entries(cats)) {
      // buildCategory が source 不一致だとここで例外になる
      const m = getMasters(categoryKey);

      expect(m.categoryKey).toBe(categoryKey);
      expect(m.idField).toBe(catDef.idField ?? "id");
      expect(m.nameField).toBe(catDef.nameField ?? "name");
      expect(typeof m.catDef?.source).toBe("string");
      expect(m.catDef.source).toBe(catDef.source);

      // 「読み込めてる」ことの最低限チェック
      expect(Array.isArray(m.list)).toBe(true);
      expect(m.byId).toBeInstanceOf(Map);
      expect(m.byName).toBeInstanceOf(Map);

      // list の各行が id/name を持つこと（normalizeRowが効いている）
      for (const row of m.list) {
        const id = row?.[m.idField];
        const name = row?.[m.nameField];

        expect(isFiniteNumber(id)).toBe(true);
        expect(typeof name).toBe("string");
        expect(name.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("byId / byName / nameById work for at least one row in each category", () => {
    const cats = registry?.categories ?? {};

    for (const categoryKey of Object.keys(cats)) {
      const m = getMasters(categoryKey);
      const list = all(categoryKey);

      // もし「空カテゴリ」があり得るなら、ここを continue にしてOK
      expect(list.length).toBeGreaterThan(0);

      const first = list[0];
      const id = first[m.idField];
      const name = first[m.nameField];

      // byId は Map にヒットするか
      const hitById = byId(categoryKey, id);
      expect(hitById).not.toBeNull();
      expect(hitById[m.idField]).toBe(id);

      // byName もヒットするか
      const hitByName = byName(categoryKey, name);
      expect(hitByName).not.toBeNull();
      expect(hitByName[m.nameField]).toBe(name);

      // nameById も返るか
      expect(nameById(categoryKey, id)).toBe(name);
    }
  });

  it("unknown category throws", () => {
    expect(() => getMasters("__no_such_category__")).toThrow();
  });
});
