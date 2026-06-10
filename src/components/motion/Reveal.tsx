import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { motion } from "motion/react";

import { motionTags, type MotionTag } from "@/components/motion/motionTags";
import { expandTransition } from "@/lib/motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  as?: MotionTag;
} & Omit<ComponentPropsWithoutRef<typeof motion.div>, "initial" | "animate" | "transition">;

/** 通用单元素揭示：用于解析区展开、统计块等。 */
export function Reveal({ children, className, as = "div", ...rest }: RevealProps) {
  const Component = motionTags[as] as typeof motion.div;

  return (
    <Component
      animate={{ opacity: 1, y: 0 }}
      className={className}
      initial={{ opacity: 0, y: 6 }}
      transition={expandTransition}
      {...rest}
    >
      {children}
    </Component>
  );
}
