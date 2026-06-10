import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { motion } from "motion/react";

import { motionTags, type MotionTag } from "@/components/motion/motionTags";
import { staggerContainer, staggerItem } from "@/lib/motion";

type StaggerProps = {
  children: ReactNode;
  className?: string;
  /** 渲染的容器标签，默认 div。 */
  as?: MotionTag;
} & Omit<ComponentPropsWithoutRef<typeof motion.div>, "variants" | "initial" | "animate">;

/** 列表/网格容器：子项（StaggerItem）依次入场。 */
export function Stagger({ children, className, as = "div", ...rest }: StaggerProps) {
  const Component = motionTags[as] as typeof motion.div;

  return (
    <Component
      animate="visible"
      className={className}
      initial="hidden"
      variants={staggerContainer}
      {...rest}
    >
      {children}
    </Component>
  );
}

type StaggerItemProps = {
  children: ReactNode;
  className?: string;
  as?: MotionTag;
} & Omit<ComponentPropsWithoutRef<typeof motion.div>, "variants">;

/** Stagger 容器内的单个子项。 */
export function StaggerItem({ children, className, as = "div", ...rest }: StaggerItemProps) {
  const Component = motionTags[as] as typeof motion.div;

  return (
    <Component className={className} variants={staggerItem} {...rest}>
      {children}
    </Component>
  );
}
