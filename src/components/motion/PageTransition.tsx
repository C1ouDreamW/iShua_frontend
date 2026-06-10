import { motion } from "motion/react";
import type { ReactNode } from "react";

import { fadeSlideUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

type PageTransitionProps = {
  children: ReactNode;
  className?: string;
};

/**
 * 页面级入场容器：用于无持久父级的独立路由页（首页、登录、注册、访客刷题）。
 * reduced-motion 由根部 MotionConfig reducedMotion="user" 统一降级为纯淡入。
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      animate="visible"
      className={cn(className)}
      initial="hidden"
      variants={fadeSlideUp}
    >
      {children}
    </motion.div>
  );
}
