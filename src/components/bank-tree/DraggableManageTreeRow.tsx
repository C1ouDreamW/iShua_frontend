import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, FileText, Folder, GripVertical } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { isFolderNode } from "@/api/bankNodes";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

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
  const [expanded, setExpanded] = useState(depth < 2);
  const isSelected = selectedId != null && nodeId === selectedId;
  const fallbackKey = `node-${depth}-${index}`;
  const rowRef = useRef<HTMLLIElement | null>(null);

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

  const setNodeRef = useCallback(
    (element: HTMLElement | null) => {
      setDragRef(element);
      setDropRef(element);
    },
    [setDragRef, setDropRef],
  );

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <li
      aria-expanded={hasChildren ? expanded : undefined}
      ref={rowRef}
      role="treeitem"
    >
      <div
        className={cn(
          "flex w-full items-center gap-1 rounded-md pr-2 transition-colors",
          isSelected
            ? "bg-brand-muted text-brand"
            : "text-text-primary hover:bg-bg-sheet",
          isOver && !isDragging && "ring-1 ring-brand/40",
          isDragging && "opacity-60",
        )}
        ref={setNodeRef}
        style={style}
      >
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
            <Folder
              aria-hidden="true"
              className={cn(
                "size-4 shrink-0",
                isSelected ? "text-brand" : "text-text-muted",
              )}
            />
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
