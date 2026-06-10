import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

import { fadeIn } from "@/lib/motion";

type ContentCrossfadeProps = {
  /** 用于区分 loading / error / empty / content 等状态的 key。 */
  stateKey: string;
  children: ReactNode;
  className?: string;
};

/** 骨架屏与真实内容之间的交叉淡入，避免硬切闪屏。 */
export function ContentCrossfade({
  stateKey,
  children,
  className,
}: ContentCrossfadeProps) {
  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        animate="visible"
        className={className}
        exit="exit"
        initial="hidden"
        key={stateKey}
        variants={fadeIn}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
