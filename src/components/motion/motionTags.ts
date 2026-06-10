import { motion } from "motion/react";

/**
 * 预创建的 motion 标签组件映射。
 * 在渲染期通过映射取用，避免 `motion(tag)` 在渲染中动态创建组件。
 */
export const motionTags = {
  div: motion.div,
  ul: motion.ul,
  li: motion.li,
  article: motion.article,
  section: motion.section,
  dl: motion.dl,
  tbody: motion.tbody,
  tr: motion.tr,
} as const;

export type MotionTag = keyof typeof motionTags;
