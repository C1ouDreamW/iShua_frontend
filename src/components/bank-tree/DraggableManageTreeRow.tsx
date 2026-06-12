import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, FileText, Folder, GripVertical } from "lucide-react";
import { useState } from "react";

import { isFolderNode } from "@/api/bankNodes";
import { cn } from "@/lib/utils";

import type { TreeBankNode } from "./buildBankTree";

type DraggableManageTreeRowProps = {
  depth?: number;
  node: TreeBankNode;
  onSelect: (node: TreeBankNode) => void;
  selectedId?: number | null;
};

export function DraggableManageTreeRow({
  depth = 0,
  node,
  onSelect,
  selectedId,
}: DraggableManageTreeRowProps) {
  const nodeId = node.id;
  const hasChildren = node.children.length > 0;
  const isFolder = isFolderNode(node);
  const [expanded, setExpanded] = useState(depth < 2);
  const isSelected = selectedId != null && nodeId === selectedId;

  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef: setDragRef,
    transform,
  } = useDraggable({
    disabled: nodeId == null,
    id: nodeId ?? "unknown",
  });

  const { isOver, setNodeRef: setDropRef } = useDroppable({
    disabled: nodeId == null,
    id: nodeId ?? "unknown",
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <li>
      <div
        className={cn(
          "flex w-full items-center gap-1 rounded-md pr-2 transition-colors",
          isSelected
            ? "bg-brand-muted text-brand"
            : "text-text-primary hover:bg-bg-sheet",
          isOver && !isDragging && "ring-1 ring-brand/40",
          isDragging && "opacity-60",
        )}
        ref={(element) => {
          setDragRef(element);
          setDropRef(element);
        }}
        style={style}
      >
        <button
          aria-label="拖拽排序"
          className="flex size-7 shrink-0 cursor-grab items-center justify-center rounded-sm text-text-muted hover:bg-bg-canvas active:cursor-grabbing"
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" className="size-4" />
        </button>

        {hasChildren ? (
          <button
            aria-expanded={expanded}
            aria-label={expanded ? "折叠" : "展开"}
            className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-muted hover:bg-bg-canvas"
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
          className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left text-sm"
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

      {hasChildren && expanded ? (
        <ul className="space-y-0.5">
          {node.children.map((child) => (
            <DraggableManageTreeRow
              depth={depth + 1}
              key={child.id ?? child.title}
              node={child}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
