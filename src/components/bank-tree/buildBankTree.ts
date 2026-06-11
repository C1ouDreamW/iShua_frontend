import type { BankNode } from "@/api/bankNodes";

export type TreeBankNode = BankNode & {
  children: TreeBankNode[];
};

export function buildBankTree(flat: BankNode[]): TreeBankNode[] {
  if (flat.length === 0) {
    return [];
  }

  const sorted = [...flat].sort(
    (left, right) => (left.sortNo ?? 0) - (right.sortNo ?? 0),
  );
  const byId = new Map<number, TreeBankNode>();

  for (const node of sorted) {
    if (node.id == null) {
      continue;
    }
    byId.set(node.id, { ...node, children: [] });
  }

  const roots: TreeBankNode[] = [];

  for (const node of sorted) {
    if (node.id == null) {
      continue;
    }

    const treeNode = byId.get(node.id);
    if (!treeNode) {
      continue;
    }

    const parentId = node.parentId ?? null;
    if (parentId == null) {
      roots.push(treeNode);
      continue;
    }

    const parent = byId.get(parentId);
    if (parent) {
      parent.children.push(treeNode);
    } else {
      roots.push(treeNode);
    }
  }

  sortTreeChildren(roots);
  return roots;
}

function sortTreeChildren(nodes: TreeBankNode[]) {
  nodes.sort((left, right) => (left.sortNo ?? 0) - (right.sortNo ?? 0));
  for (const node of nodes) {
    sortTreeChildren(node.children);
  }
}

/** 私有刷题 Tab：保留私有 LEAF 及其祖先 FOLDER */
export function filterPrivatePracticeNodes(flat: BankNode[]): BankNode[] {
  if (flat.length === 0) {
    return [];
  }

  const byId = new Map<number, BankNode>();
  for (const node of flat) {
    if (node.id != null) {
      byId.set(node.id, node);
    }
  }

  const includeIds = new Set<number>();
  for (const node of flat) {
    if (node.nodeKind !== "LEAF" || node.isPublic === 1 || node.id == null) {
      continue;
    }

    let current: BankNode | undefined = node;
    while (current?.id != null) {
      includeIds.add(current.id);
      current =
        current.parentId != null ? byId.get(current.parentId) : undefined;
    }
  }

  return flat.filter((node) => node.id != null && includeIds.has(node.id));
}
