import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

import { fadeIn } from "@/lib/motion";
import { cn } from "@/lib/utils";

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
    <div className={cn("grid min-h-64", className)}>
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          animate="visible"
          className="col-start-1 row-start-1 min-w-0"
          exit="exit"
          initial="hidden"
          key={stateKey}
          variants={fadeIn}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
