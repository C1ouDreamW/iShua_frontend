import { useMemo, useState } from "react";
import { Outlet, useMatch, useNavigate } from "react-router-dom";

import {
  moveBankNode,
  type BankNode,
  type BankNodeKind,
} from "@/api/bankNodes";
import { BankNodeFormDrawer } from "@/components/bank/BankNodeFormDrawer";
import { DeleteBankNodeDialog } from "@/components/bank/DeleteBankNodeDialog";
import {
  computeBankNodeMove,
  getNodeDepth,
} from "@/components/bank-tree/computeBankNodeMove";
import { DraggableManageTree } from "@/components/bank-tree/DraggableManageTree";
import type { TreeBankNode } from "@/components/bank-tree/buildBankTree";
import { useBankTree } from "@/components/bank-tree/useBankTree";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/useAppToast";
import { resolveApiErrorMessage } from "@/lib/apiErrors";

export type ManageBanksOutletContext = {
  previewNode: BankNode | null;
  onAddChild: (parentId: number, kind: BankNodeKind) => void;
  onDeleteNode: (node: BankNode) => void;
  onEditNode: (node: BankNode) => void;
  refreshTree: () => void;
};

export function ManageBanksLayout() {
  const navigate = useNavigate();
  const detailMatch = useMatch({
    end: false,
    path: "/app/manage/banks/:bankId",
  });
  const activeNodeId = detailMatch?.params.bankId
    ? Number(detailMatch.params.bankId)
    : null;

  const { error, flatNodes, loading, refresh, tree } = useBankTree();
  const { error: showError, show, success } = useAppToast();

  const [folderPreviewId, setFolderPreviewId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formParentId, setFormParentId] = useState<number | null>(null);
  const [formFixedKind, setFormFixedKind] = useState<BankNodeKind>("LEAF");
  const [editingNode, setEditingNode] = useState<BankNode | null>(null);
  const [deletingNode, setDeletingNode] = useState<BankNode | null>(null);

  const previewNode = useMemo(() => {
    if (folderPreviewId == null) {
      return null;
    }
    return flatNodes.find((node) => node.id === folderPreviewId) ?? null;
  }, [flatNodes, folderPreviewId]);

  const treeSelectedId = activeNodeId ?? folderPreviewId;

  function openCreate(kind: BankNodeKind, parentId: number | null = null) {
    setEditingNode(null);
    setFormParentId(parentId);
    setFormFixedKind(kind);
    setFormOpen(true);
  }

  function openEdit(node: BankNode) {
    setEditingNode(node);
    setFormParentId(node.parentId ?? null);
    setFormFixedKind(node.nodeKind === "FOLDER" ? "FOLDER" : "LEAF");
    setFormOpen(true);
  }

  function handleSelect(node: TreeBankNode) {
    if (node.nodeKind === "LEAF" && node.id != null) {
      navigate(`/app/manage/banks/${node.id}`);
      return;
    }

    if (node.id != null) {
      setFolderPreviewId(node.id);
      if (activeNodeId != null) {
        navigate("/app/manage/banks");
      }
    }
  }

  async function handleMove(activeId: number, overId: number) {
    const move = computeBankNodeMove(flatNodes, activeId, overId);
    if (!move) {
      return;
    }

    const parentDepth =
      move.newParentId == null ? -1 : getNodeDepth(flatNodes, move.newParentId);
    if (parentDepth + 1 > 10) {
      show({ message: "当前层级已超过 10 层，结构可能较难维护。" });
    }

    try {
      await moveBankNode(activeId, move);
      refresh();
      success("已移动节点");
    } catch (caught) {
      showError(resolveApiErrorMessage(caught, "移动失败，请重试。"));
    }
  }

  function handleSaved(nodeId?: number) {
    refresh();
    success("保存成功");

    if (!nodeId) {
      return;
    }

    if (formFixedKind === "LEAF") {
      navigate(`/app/manage/banks/${nodeId}`);
      return;
    }

    setFolderPreviewId(nodeId);
    navigate("/app/manage/banks");
  }

  const outletContext: ManageBanksOutletContext = {
    onAddChild: (parentId, kind) => openCreate(kind, parentId),
    onDeleteNode: setDeletingNode,
    onEditNode: openEdit,
    previewNode,
    refreshTree: refresh,
  };

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-text-primary">
            管理题库
          </h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            用文件夹组织多层结构；拖拽左侧手柄可调整层级与排序。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => openCreate("FOLDER")} variant="outline">
            新建文件夹
          </Button>
          <Button onClick={() => openCreate("LEAF")}>新建题库</Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)]">
        <aside className="paper-panel flex max-h-[calc(100vh-12rem)] flex-col gap-3 overflow-hidden p-3">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-text-muted">
            我的题库树
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <DraggableManageTree
              error={error}
              loading={loading}
              onMove={(activeId, overId) => void handleMove(activeId, overId)}
              onRetry={refresh}
              onSelect={handleSelect}
              selectedId={treeSelectedId}
              tree={tree}
            />
          </div>
        </aside>

        <main className="min-w-0">
          <Outlet context={outletContext} />
        </main>
      </div>

      <BankNodeFormDrawer
        fixedKind={formFixedKind}
        node={editingNode}
        onOpenChange={setFormOpen}
        onSaved={handleSaved}
        open={formOpen}
        parentId={formParentId}
      />

      <DeleteBankNodeDialog
        node={deletingNode}
        onDeleted={() => {
          refresh();
          success("已删除");
          if (deletingNode?.id === activeNodeId || deletingNode?.id === folderPreviewId) {
            setFolderPreviewId(null);
            navigate("/app/manage/banks");
          }
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingNode(null);
          }
        }}
        open={Boolean(deletingNode)}
      />
    </section>
  );
}
