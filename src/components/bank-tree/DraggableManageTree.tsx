import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { cn } from "@/lib/utils";

import { DragPointerContext } from "./DragPointerContext";
import type { TreeBankNode } from "./buildBankTree";
import { DraggableManageTreeRow } from "./DraggableManageTreeRow";

/** 行节点同时是 draggable + droppable，须排除 active，否则 closestCenter 总命中自身 */
const treeCollisionDetection: CollisionDetection = (args) => {
  const filtered = {
    ...args,
    droppableContainers: args.droppableContainers.filter(
      (container) => container.id !== args.active.id,
    ),
  };

  const pointerHits = pointerWithin(filtered);
  if (pointerHits.length > 0) {
    return pointerHits;
  }

  return closestCenter(filtered);
};

type DraggableManageTreeProps = {
  className?: string;
  error?: string | null;
  loading?: boolean;
  onMove: (activeId: number, overId: number) => void;
  onRetry?: () => void;
  onSelect: (node: TreeBankNode) => void;
  selectedId?: number | null;
  tree: TreeBankNode[];
};

export function DraggableManageTree({
  className,
  error,
  loading,
  onMove,
  onRetry,
  onSelect,
  selectedId,
  tree,
}: DraggableManageTreeProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor),
  );

  const [isDragging, setIsDragging] = useState(false);
  const [dragPointer, setDragPointer] = useState<{ y: number } | null>(null);

  // 拖拽期间监听全局 pointermove，记录鼠标 clientY 供 rows 计算落点位置
  useEffect(() => {
    if (!isDragging) {
      return;
    }
    const handler = (event: PointerEvent) => {
      setDragPointer({ y: event.clientY });
    };
    window.addEventListener("pointermove", handler);
    return () => window.removeEventListener("pointermove", handler);
  }, [isDragging]);

  function handleDragEnd(event: DragEndEvent) {
    setIsDragging(false);
    setDragPointer(null);
    const activeId = Number(event.active.id);
    const overId = event.over ? Number(event.over.id) : NaN;

    if (
      !Number.isFinite(activeId) ||
      !Number.isFinite(overId) ||
      activeId === overId
    ) {
      return;
    }

    onMove(activeId, overId);
  }

  function handleDragCancel() {
    setIsDragging(false);
    setDragPointer(null);
  }

  if (loading) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            className="h-9 animate-pulse rounded-md bg-bg-sheet"
            key={index}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorState message={error} onRetry={onRetry} />
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          description="新建文件夹或题库，开始组织你的题目结构。"
          title="还没有节点"
        />
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={treeCollisionDetection}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
      onDragStart={() => setIsDragging(true)}
      sensors={sensors}
    >
      <DragPointerContext.Provider value={dragPointer}>
        <ul className={cn("space-y-0.5", className)} role="tree">
          {tree.map((node, index) => (
            <DraggableManageTreeRow
              index={index}
              key={node.id ?? `node-${index}`}
              node={node}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </ul>
        <p className="mt-3 px-1 text-xs leading-5 text-text-muted">
          拖拽手柄可调整层级与排序；拖到文件夹上将成为其子节点，拖到题库行上下边缘可上插/下插。
        </p>
      </DragPointerContext.Provider>
    </DndContext>
  );
}
