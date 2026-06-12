import { describe, expect, it } from "vitest";

import type { BankNode } from "@/api/bankNodes";

import {
  computeBankNodeMove,
  getNodeDepth,
  isDescendant,
} from "./computeBankNodeMove";

function node(
  id: number,
  parentId: number | null,
  sortNo: number,
  kind: "FOLDER" | "LEAF" = "FOLDER",
): BankNode {
  return { id, nodeKind: kind, parentId, sortNo, title: String(id) };
}

describe("computeBankNodeMove", () => {
  const flat: BankNode[] = [
    node(1, null, 0),
    node(2, 1, 0),
    node(3, 2, 0, "LEAF"),
    node(4, 2, 1, "LEAF"),
    node(5, null, 1, "LEAF"),
  ];

  it("moves node into folder as last child", () => {
    expect(computeBankNodeMove(flat, 5, 2)).toEqual({
      newParentId: 2,
      newSortNo: 2,
    });
  });

  it("reorders siblings before target leaf when moving up", () => {
    expect(computeBankNodeMove(flat, 4, 3)).toEqual({
      newParentId: 2,
      newSortNo: 0,
    });
  });

  it("reorders siblings after target leaf when moving down", () => {
    expect(computeBankNodeMove(flat, 3, 4)).toEqual({
      newParentId: 2,
      newSortNo: 1,
    });
  });

  it("rejects moving into descendant", () => {
    expect(computeBankNodeMove(flat, 1, 3)).toBeNull();
  });
});

describe("getNodeDepth", () => {
  it("returns depth from root", () => {
    const flat = [node(1, null, 0), node(2, 1, 0), node(3, 2, 0, "LEAF")];
    expect(getNodeDepth(flat, 3)).toBe(2);
  });
});

describe("isDescendant", () => {
  it("detects nested nodes", () => {
    const flat = [node(1, null, 0), node(2, 1, 0), node(3, 2, 0, "LEAF")];
    expect(isDescendant(flat, 1, 3)).toBe(true);
    expect(isDescendant(flat, 2, 3)).toBe(true);
    expect(isDescendant(flat, 1, 2)).toBe(true);
    expect(isDescendant(flat, 2, 1)).toBe(false);
  });
});
