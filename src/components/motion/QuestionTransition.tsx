import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";

import { slideVariants } from "@/lib/motion";

type QuestionTransitionProps = {
  /** 当前题目索引，用于推断切换方向。 */
  currentIndex: number;
  /** 题目唯一标识，作为 AnimatePresence 的 key。 */
  questionKey: string | number;
  className?: string;
  children: ReactNode;
};

/**
 * 方向感知的题面切换：前进时新题自右滑入，后退时自左滑入。
 * 三处刷题（PracticePlayer / WrongPracticePlayer / GuestPracticePage）共用，
 * reduced-motion 由根部 MotionConfig 统一降级为纯淡入。
 */
export function QuestionTransition({
  currentIndex,
  questionKey,
  className,
  children,
}: QuestionTransitionProps) {
  const [prevIndex, setPrevIndex] = useState(currentIndex);
  const [direction, setDirection] = useState<1 | -1>(1);

  if (currentIndex !== prevIndex) {
    setDirection(currentIndex > prevIndex ? 1 : -1);
    setPrevIndex(currentIndex);
  }

  return (
    <AnimatePresence custom={direction} initial={false} mode="wait">
      <motion.article
        animate="center"
        className={className}
        custom={direction}
        exit="exit"
        initial="enter"
        key={questionKey}
        variants={slideVariants}
      >
        {children}
      </motion.article>
    </AnimatePresence>
  );
}
