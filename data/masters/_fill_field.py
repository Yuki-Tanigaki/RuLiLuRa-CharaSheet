#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
配列（list[dict]）に対して、別の配列（values）を「上から順番に」指定キーへ流し込む。

要件:
- 対象キー: 例 "price"
- values は ["8万", "不要", "無料", 120000, None, ...] のように混在OK
- "万" は数値に直す（例: "8万" -> 80000）
- "不要" と "無料" は 0
- それ以外の属性は全部そのまま残す
- 追加: 「数値に見える文字列」も “文字列のまま” 入れたいケースに対応
  - デフォルト: 数値文字列は変換しない（"123" は "123" のまま）
  - --coerce-number を付けたときだけ数値文字列も数値へ変換
"""

from __future__ import annotations
import json
import re
from typing import Any, Iterable, List, Dict


def parse_value(v: Any, *, coerce_number_str: bool = False) -> Any:
    """
    文字列の "万" / "不要" / "無料" を変換して返す。
    それ以外は基本そのまま返す。

    coerce_number_str=True のときのみ:
      - "80,000" / "123" / "12.5" のような数値文字列を数値へ変換する
    """
    if v is None:
        return None

    # すでに数値ならそのまま
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        if isinstance(v, float) and v.is_integer():
            return int(v)
        return v

    s = str(v).strip()

    # 無料/不要 -> 0
    if s in ("不要", "無料"):
        return 0

    # "8万" / "8.5万" / "  8 万 " を許容
    m = re.fullmatch(r"([0-9]+(?:\.[0-9]+)?)\s*万", s)
    if m:
        num = float(m.group(1)) * 10000
        return int(num) if num.is_integer() else num

    # ここから先は「数値文字列を変換するかどうか」の方針次第
    if not coerce_number_str:
        return v  # 文字列は文字列のまま

    # 数値文字列の変換（任意）
    s2 = s.replace(",", "")
    if re.fullmatch(r"-?[0-9]+", s2):
        return int(s2)
    if re.fullmatch(r"-?[0-9]+(?:\.[0-9]+)?", s2):
        x = float(s2)
        return int(x) if x.is_integer() else x

    return v


def fill_field_in_order(
    items: List[Dict[str, Any]],
    field: str,
    values: Iterable[Any],
    *,
    coerce_number_str: bool = False,
) -> List[Dict[str, Any]]:
    """
    items の 0番から順に、field に values を入れる（足りない場合はそこで終了）。
    items 自体を破壊的に更新して返す。
    """
    vals = list(values)
    n = min(len(items), len(vals))
    for i in range(n):
        items[i][field] = parse_value(vals[i], coerce_number_str=coerce_number_str)
    return items


def main():
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("--items", required=True, help="入力JSON（配列）ファイルパス")
    ap.add_argument("--values", required=True, help="流し込む値のテキスト（1行1値）ファイルパス")
    ap.add_argument("--field", required=True, help="流し込む対象キー（例: price）")
    ap.add_argument("--out", required=True, help="出力JSONファイルパス")
    ap.add_argument(
        "--coerce-number",
        action="store_true",
        help='数値に見える文字列（"123", "80,000", "12.5" 等）を数値に変換する（デフォルトは変換しない）',
    )
    args = ap.parse_args()

    with open(args.items, "r", encoding="utf-8") as f:
        items = json.load(f)
    if not isinstance(items, list):
        raise ValueError("items JSON は配列(list)である必要があります")

    with open(args.values, "r", encoding="utf-8") as f:
        raw_lines = [ln.rstrip("\n") for ln in f.readlines()]

    # 空行を無視（必要なら）
    values = [ln.strip() for ln in raw_lines if ln.strip() != ""]

    fill_field_in_order(items, args.field, values, coerce_number_str=args.coerce_number)

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

    print(f"OK: wrote {len(items)} items to {args.out}")


if __name__ == "__main__":
    main()
