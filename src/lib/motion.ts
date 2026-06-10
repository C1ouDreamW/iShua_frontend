import { useReducedMotion } from "motion/react";
import type { Transition, Variants } from "motion/react";

/**
 * 动效时长（秒）—— 与 tokens.css 中的 --motion-* 对齐。
 * motion 以秒为单位，CSS token 以毫秒定义。
 */
export const DURATION = {
  press: 0.1,
  page: 0.2,
  expand: 0.22,
} as const;

/** 与现有 CSS 一致的缓动曲线 cubic-bezier(0.2, 0, 0, 1)。 */
export const EASE_OUT = [0.2, 0, 0, 1] as const;

/** 完成页统计依次入场的步进（秒）。 */
export const STAGGER_STEP = 0.035;

export const pageTransition: Transition = {
  duration: DURATION.page,
  ease: EASE_OUT,
};

export const expandTransition: Transition = {
  duration: DURATION.expand,
  ease: EASE_OUT,
};

/** 纯淡入。 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: pageTransition },
  exit: { opacity: 0, transition: { duration: DURATION.press, ease: EASE_OUT } },
};

/** 淡入 + 轻微上移，用于页面/卡片入场。 */
export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: pageTransition },
  exit: { opacity: 0, y: -8, transition: { duration: DURATION.press, ease: EASE_OUT } },
};

/** 列表/网格容器：子项依次入场。 */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: STAGGER_STEP,
      delayChildren: 0.02,
    },
  },
};

/** 列表/网格子项。 */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: pageTransition },
};

export type SlideDirection = 1 | -1;

/**
 * 方向感知的滑动切换（刷题翻页 / 向导步进）。
 * direction = 1 表示前进（新内容自右进入），-1 表示后退。
 */
export const slideVariants: Variants = {
  enter: (direction: SlideDirection) => ({
    opacity: 0,
    x: direction * 16,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: pageTransition,
  },
  exit: (direction: SlideDirection) => ({
    opacity: 0,
    x: direction * -16,
    transition: { duration: DURATION.press, ease: EASE_OUT },
  }),
};

/** 根据用户「减少动态效果」偏好返回降级后的过渡配置。 */
export function useMotionPreset() {
  const prefersReducedMotion = useReducedMotion();

  return {
    prefersReducedMotion,
    pageTransition: prefersReducedMotion
      ? { duration: 0 }
      : pageTransition,
    expandTransition: prefersReducedMotion
      ? { duration: 0 }
      : expandTransition,
  };
}
