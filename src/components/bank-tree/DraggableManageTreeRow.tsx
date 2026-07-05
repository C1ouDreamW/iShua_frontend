import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, FileText, Folder, FolderOpen, GripVertical } from "lucide-react";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { isFolderNode } from "@/api/bankNodes";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { DragPointerContext } from "./DragPointerContext";
import type { TreeBankNode } from "./buildBankTree";

function nodeContainsId(node: TreeBankNode, id: number | null | undefined): boolean {
  if (id == null) {
    return false;
  }
  if (node.id === id) {
    return true;
  }
  return node.children.some((child) => nodeContainsId(child, id));
}

type DropPosition = "before" | "after" | "inside";

type DraggableManageTreeRowProps = {
  depth?: number;
  index: number;
  node: TreeBankNode;
  onSelect: (node: TreeBankNode) => void;
  selectedId?: number | null;
};

export function DraggableManageTreeRow({
  depth = 0,
  index,
  node,
  onSelect,
  selectedId,
}: DraggableManageTreeRowProps) {
  const nodeId = node.id;
  const hasChildren = node.children.length > 0;
  const isFolder = isFolderNode(node);
  const [expanded, setExpanded] = useState(depth < 1);
  const isSelected = selectedId != null && nodeId === selectedId;
  const fallbackKey = `node-${depth}-${index}`;
  const rowRef = useRef<HTMLLIElement | null>(null);
  const dropElRef = useRef<HTMLDivElement | null>(null);
  const dragPointer = useContext(DragPointerContext);

  const containsSelected = useMemo(
    () =>
      selectedId != null &&
      nodeId !== selectedId &&
      nodeContainsId(node, selectedId),
    [node, nodeId, selectedId],
  );

  useEffect(() => {
    if (containsSelected) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 选中节点在折叠子树内时，自动展开祖先以保持可见
      setExpanded(true);
    }
  }, [containsSelected]);

  useEffect(() => {
    if (isSelected && rowRef.current) {
      rowRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [isSelected]);

  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef: setDragRef,
    transform,
  } = useDraggable({
    disabled: nodeId == null,
    id: nodeId ?? fallbackKey,
  });

  const { isOver, setNodeRef: setDropRef } = useDroppable({
    disabled: nodeId == null,
    id: nodeId ?? fallbackKey,
  });

  // draggable ref 挂在 <li> 上，使 transform 应用到整行（含子树），子节点跟随父节点拖拽；
  // droppable ref 保留在内部 <div> 上，仅标题行作为放置目标，避免整棵子树都可放置。
  const setLiRef = useCallback(
    (element: HTMLLIElement | null) => {
      rowRef.current = element;
      setDragRef(element);
    },
    [setDragRef],
  );

  const setDropElRef = useCallback(
    (element: HTMLDivElement | null) => {
      dropElRef.current = element;
      setDropRef(element);
    },
    [setDropRef],
  );

  // 根据鼠标 clientY 与本行 droppable rect 判断落点：
  // folder → "inside"（成为子节点）；leaf → 上半 "before" / 下半 "after"（同级前插/后插）
  // 必须在 effect 中做：DOM 测量依赖真实元素，且 dragPointer 变化时需重算并触发渲染
  const [dropPosition, setDropPosition] = useState<DropPosition | null>(null);
  useEffect(() => {
    if (!isOver || !dragPointer || !dropElRef.current) {
      if (dropPosition != null) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- dragPointer 变化时需基于 DOM 测量重算落点
        setDropPosition(null);
      }
      return;
    }
    const rect = dropElRef.current.getBoundingClientRect();
    const relY = dragPointer.y - rect.top;
    const next: DropPosition = isFolder
      ? "inside"
      : relY < rect.height / 2
        ? "before"
        : "after";
    if (dropPosition !== next) {
      setDropPosition(next);
    }
  }, [dragPointer, isOver, isFolder, dropPosition]);

  const dragStyle = {
    transform: CSS.Translate.toString(transform),
  };

  const showInside = dropPosition === "inside";
  const showBefore = dropPosition === "before";
  const showAfter = dropPosition === "after";

  return (
    <li
      aria-expanded={hasChildren ? expanded : undefined}
      data-node-id={nodeId ?? undefined}
      ref={setLiRef}
      role="treeitem"
      style={dragStyle}
    >
      <div
        className={cn(
          "relative flex w-full items-center gap-1 rounded-md pr-2 transition-colors",
          isSelected
            ? "bg-brand-muted text-brand"
            : "text-text-primary hover:bg-bg-sheet",
          showInside && "bg-brand-muted ring-1 ring-brand/60",
          !showInside && isOver && !isDragging && "ring-1 ring-brand/40",
          isDragging && "opacity-60",
        )}
        ref={setDropElRef}
      >
        {showBefore && (
          <span className="pointer-events-none absolute inset-x-0 -top-px z-10 h-0.5 rounded-full bg-brand" />
        )}
        {showAfter && (
          <span className="pointer-events-none absolute inset-x-0 -bottom-px z-10 h-0.5 rounded-full bg-brand" />
        )}

        <button
          aria-label="拖拽排序"
          className="flex size-7 shrink-0 cursor-grab items-center justify-center rounded-sm text-text-muted hover:bg-bg-canvas active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-bg-canvas"
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" className="size-4" />
        </button>

        {hasChildren ? (
          <button
            aria-label={expanded ? "折叠" : "展开"}
            className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-muted hover:bg-bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-bg-canvas"
            onClick={() => setExpanded((value) => !value)}
            type="button"
          >
            <ChevronRight
              aria-hidden="true"
              className={cn(
                "size-4 transition-transform",
                expanded && "rotate-90",
              )}
            />
          </button>
        ) : (
          <span className="size-7 shrink-0" />
        )}

        <button
          aria-selected={isSelected || undefined}
          className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          onClick={() => onSelect(node)}
          style={{ paddingLeft: `${depth * 12}px` }}
          type="button"
        >
          {isFolder ? (
            showInside ? (
              <FolderOpen
                aria-hidden="true"
                className={cn(
                  "size-4 shrink-0",
                  isSelected ? "text-brand" : "text-text-muted",
                )}
              />
            ) : (
              <Folder
                aria-hidden="true"
                className={cn(
                  "size-4 shrink-0",
                  isSelected ? "text-brand" : "text-text-muted",
                )}
              />
            )
          ) : (
            <FileText
              aria-hidden="true"
              className={cn(
                "size-4 shrink-0",
                isSelected ? "text-brand" : "text-text-muted",
              )}
            />
          )}
          <span className="min-w-0 flex-1 truncate font-medium">
            {node.title ?? "未命名"}
          </span>
          {!isFolder && node.questionCount != null ? (
            <span className="shrink-0 text-xs text-text-muted">
              {node.questionCount}
            </span>
          ) : null}
        </button>
      </div>

      {hasChildren ? (
        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.ul
              animate={{ height: "auto", opacity: 1 }}
              className="space-y-0.5 overflow-hidden"
              exit={{ height: 0, opacity: 0 }}
              initial={{ height: 0, opacity: 0 }}
              role="group"
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              {node.children.map((child, childIndex) => (
                <DraggableManageTreeRow
                  depth={depth + 1}
                  index={childIndex}
                  key={child.id ?? `node-${depth + 1}-${childIndex}`}
                  node={child}
                  onSelect={onSelect}
                  selectedId={selectedId}
                />
              ))}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      ) : null}
    </li>
  );
}
