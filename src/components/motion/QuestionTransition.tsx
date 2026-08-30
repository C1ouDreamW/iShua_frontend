import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

import { slideVariants, type SlideDirection } from "@/lib/motion";

type QuestionTransitionProps = {
  /** 当前题目索引，用于推断切换方向（当 direction 未传时作为 fallback）。 */
  currentIndex?: number;
  /** 显式切换方向，覆盖 currentIndex 推断。restart/jump 场景可传 1 避免误判为后退。 */
  direction?: SlideDirection;
  /** 题目唯一标识，作为 AnimatePresence 的 key。 */
  questionKey: string | number;
  className?: string;
  children: ReactNode;
};

/**
 * 方向感知的题面切换：前进时新题自右滑入，后退时自左滑入。
 * 三处刷题（PracticePlayer / WrongPracticePlayer / GuestPracticePage）共用，
 * reduced-motion 由根部 MotionConfig 统一降级为纯淡入。
 *
 * 使用 popLayout 模式：退场题卡绝对定位、入场题卡正常流入，两者交叉过渡，
 * 避免 mode="wait" 的 0.3s 空窗。
 *
 * 方向在渲染期由「上次已提交的索引」（ref，effect 中更新）纯推导，
 * 不再于渲染期 setState：快速连点不会产生额外 render，方向始终稳定。
 */
export function QuestionTransition({
  currentIndex,
  direction,
  questionKey,
  className,
  children,
}: QuestionTransitionProps) {
  const prevIndexRef = useRef<number | null>(currentIndex);

  let resolvedDirection: SlideDirection = 1;
  if (direction != null) {
    resolvedDirection = direction;
  } else if (
    currentIndex != null &&
    prevIndexRef.current != null &&
    currentIndex !== prevIndexRef.current
  ) {
    resolvedDirection = currentIndex > prevIndexRef.current ? 1 : -1;
  }

  useEffect(() => {
    prevIndexRef.current = currentIndex ?? null;
  }, [currentIndex]);

  return (
    <div className="relative">
      <AnimatePresence
        custom={resolvedDirection}
        initial={false}
        mode="popLayout"
      >
        <motion.article
          animate="center"
          className={className}
          custom={resolvedDirection}
          exit="exit"
          initial="enter"
          key={questionKey}
          variants={slideVariants}
        >
          {children}
        </motion.article>
      </AnimatePresence>
    </div>
  );
}
