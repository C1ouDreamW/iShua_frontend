import { describe, expect, it } from "vitest";

import type { BankNode } from "@/api/bankNodes";

import { buildBankTree } from "./buildBankTree";

function node(
  id: number,
  parentId: number | null,
  sortNo: number,
  title: string,
): BankNode {
  return {
    id,
    nodeKind: "FOLDER",
    parentId,
    sortNo,
    title,
  };
}

describe("buildBankTree", () => {
  it("builds multiple roots in sortNo order", () => {
    const tree = buildBankTree([
      node(2, null, 2, "B"),
      node(1, null, 1, "A"),
    ]);

    expect(tree.map((item) => item.id)).toEqual([1, 2]);
    expect(tree.every((item) => item.children.length === 0)).toBe(true);
  });

  it("nests children and sorts siblings by sortNo", () => {
    const tree = buildBankTree([
      node(1, null, 0, "root"),
      { ...node(3, 1, 2, "child-b"), nodeKind: "LEAF" },
      { ...node(2, 1, 1, "child-a"), nodeKind: "LEAF" },
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.children.map((item) => item.id)).toEqual([2, 3]);
  });

  it("promotes orphans to roots when parent is missing", () => {
    const tree = buildBankTree([node(5, 99, 0, "orphan")]);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.id).toBe(5);
  });
});
