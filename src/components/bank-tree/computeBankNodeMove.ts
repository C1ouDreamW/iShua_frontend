import type { BankNode } from "@/api/bankNodes";

export type BankNodeMoveTarget = {
  newParentId: number | null;
  newSortNo: number;
};

function indexById(flat: BankNode[]): Map<number, BankNode> {
  const byId = new Map<number, BankNode>();
  for (const node of flat) {
    if (node.id != null) {
      byId.set(node.id, node);
    }
  }
  return byId;
}

export function getNodeDepth(flat: BankNode[], nodeId: number): number {
  const byId = indexById(flat);
  let depth = 0;
  let current = byId.get(nodeId);

  while (current?.parentId != null) {
    depth += 1;
    current = byId.get(current.parentId);
  }

  return depth;
}

export function isDescendant(
  flat: BankNode[],
  ancestorId: number,
  nodeId: number,
): boolean {
  if (ancestorId === nodeId) {
    return true;
  }

  const byId = indexById(flat);
  let current = byId.get(nodeId);

  while (current?.parentId != null) {
    if (current.parentId === ancestorId) {
      return true;
    }
    current = byId.get(current.parentId);
  }

  return false;
}

function listSiblings(
  flat: BankNode[],
  parentId: number | null,
  excludeId?: number,
): BankNode[] {
  return flat
    .filter(
      (node) =>
        (node.parentId ?? null) === parentId && node.id !== excludeId,
    )
    .sort((left, right) => (left.sortNo ?? 0) - (right.sortNo ?? 0));
}

export function computeBankNodeMove(
  flat: BankNode[],
  activeId: number,
  overId: number,
): BankNodeMoveTarget | null {
  if (activeId === overId) {
    return null;
  }

  const byId = indexById(flat);
  const active = byId.get(activeId);
  const over = byId.get(overId);

  if (!active || !over) {
    return null;
  }

  if (isDescendant(flat, activeId, overId)) {
    return null;
  }

  if (over.nodeKind === "FOLDER") {
    const siblings = listSiblings(flat, overId, activeId);
    return {
      newParentId: overId,
      newSortNo: siblings.length,
    };
  }

  const newParentId = over.parentId ?? null;
  const siblings = listSiblings(flat, newParentId);
  const activeIndex = siblings.findIndex((node) => node.id === activeId);
  const overIndex = siblings.findIndex((node) => node.id === overId);
  const siblingsWithoutActive = listSiblings(flat, newParentId, activeId);
  const overIndexWithoutActive = siblingsWithoutActive.findIndex(
    (node) => node.id === overId,
  );

  let newSortNo =
    overIndexWithoutActive >= 0
      ? overIndexWithoutActive
      : siblingsWithoutActive.length;

  if (activeIndex >= 0 && activeIndex < overIndex) {
    newSortNo = overIndexWithoutActive + 1;
  }

  return {
    newParentId,
    newSortNo,
  };
}

export function flattenTreeInOrder<T extends { children: T[] }>(
  tree: T[],
): T[] {
  const result: T[] = [];

  function walk(nodes: T[]) {
    for (const node of nodes) {
      result.push(node);
      if (node.children.length > 0) {
        walk(node.children);
      }
    }
  }

  walk(tree);
  return result;
}
