import { createContext } from "react";

/**
 * 拖拽过程中的鼠标垂直坐标（视口 clientY）。
 * 由 DraggableManageTree 在拖拽期间通过全局 pointermove 监听更新，
 * 供每行判断上插/下插/放入文件夹三种落点。拖拽未进行时为 null。
 *
 * 用全局 pointermove 而非 dnd-kit 的 active.rect.translated，
 * 是因为当 active 是含展开子树的 folder 时，translated rect 中心会严重偏离鼠标位置，
 * 导致 over 行的上/下插判断失真。
 */
export const DragPointerContext = createContext<{ y: number } | null>(null);
