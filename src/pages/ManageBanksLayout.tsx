import { motion } from "motion/react";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  Outlet,
  useLocation,
  useMatch,
  useNavigate,
} from "react-router-dom";

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
import { RouteFallback } from "@/components/RouteFallback";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/useAppToast";
import { fadeSlideUp } from "@/lib/motion";
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
  const location = useLocation();
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
  const [pendingScrollToId, setPendingScrollToId] = useState<number | null>(null);

  const previewNode = useMemo(() => {
    if (folderPreviewId == null) {
      return null;
    }
    return flatNodes.find((node) => node.id === folderPreviewId) ?? null;
  }, [flatNodes, folderPreviewId]);

  const treeSelectedId = activeNodeId ?? folderPreviewId;

  const openCreate = useCallback(
    (kind: BankNodeKind, parentId: number | null = null) => {
      setEditingNode(null);
      setFormParentId(parentId);
      setFormFixedKind(kind);
      setFormOpen(true);
    },
    [],
  );

  const openEdit = useCallback((node: BankNode) => {
    setEditingNode(node);
    setFormParentId(node.parentId ?? null);
    setFormFixedKind(node.nodeKind === "FOLDER" ? "FOLDER" : "LEAF");
    setFormOpen(true);
  }, []);

  const handleSelect = useCallback(
    (node: TreeBankNode) => {
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
    },
    [activeNodeId, navigate],
  );

  const handleMove = useCallback(
    async (activeId: number, overId: number) => {
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
        setPendingScrollToId(activeId);
        success("已移动节点");
      } catch (caught) {
        showError(resolveApiErrorMessage(caught, "移动失败，请重试。"));
      }
    },
    [flatNodes, refresh, show, showError, success],
  );

  // 移动完成后，等树刷新渲染再滚动到被移动的节点，方便用户定位
  useEffect(() => {
    if (pendingScrollToId == null || loading) {
      return;
    }
    const raf = requestAnimationFrame(() => {
      const element = document.querySelector(
        `[data-node-id="${pendingScrollToId}"]`,
      );
      element?.scrollIntoView({ block: "nearest" });
      setPendingScrollToId(null);
    });
    return () => cancelAnimationFrame(raf);
  }, [pendingScrollToId, loading, flatNodes]);

  const handleMoveWrapper = useCallback(
    (activeId: number, overId: number) => {
      void handleMove(activeId, overId);
    },
    [handleMove],
  );

  const handleSaved = useCallback(
    (nodeId?: number) => {
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
    },
    [formFixedKind, navigate, refresh, success],
  );

  const outletContext = useMemo<ManageBanksOutletContext>(
    () => ({
      onAddChild: (parentId, kind) => openCreate(kind, parentId),
      onDeleteNode: setDeletingNode,
      onEditNode: openEdit,
      previewNode,
      refreshTree: refresh,
    }),
    [openCreate, openEdit, previewNode, refresh],
  );

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
        <aside className="paper-panel flex max-h-[calc(100vh-12rem-3.5rem-env(safe-area-inset-bottom,0px))] flex-col gap-3 overflow-hidden p-3 lg:max-h-[calc(100vh-12rem)]">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-text-muted">
            我的题库树
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <DraggableManageTree
              error={error}
              loading={loading}
              onMove={handleMoveWrapper}
              onRetry={refresh}
              onSelect={handleSelect}
              selectedId={treeSelectedId}
              tree={tree}
            />
          </div>
        </aside>

        <main className="min-w-0">
          {/* 与 AppShell 顶层过渡一致：退场即卸载、只保留入场，子路由切换不再叠加顺序等待。
              Suspense 兜住懒加载详情页，加载期间保留左侧题库树。 */}
          <motion.div
            animate="visible"
            initial="hidden"
            key={location.pathname}
            variants={fadeSlideUp}
          >
            <Suspense fallback={<RouteFallback />}>
              <Outlet context={outletContext} />
            </Suspense>
          </motion.div>
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
