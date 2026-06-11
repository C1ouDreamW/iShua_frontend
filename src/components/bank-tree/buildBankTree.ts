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
