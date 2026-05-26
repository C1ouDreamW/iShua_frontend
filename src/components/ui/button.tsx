import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
/* eslint-disable react-refresh/only-export-components */
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none",
    "transition-[background-color,border-color,box-shadow,transform] duration-100 ease-out",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas",
    "active:translate-y-px motion-safe:active:duration-[var(--motion-press)]",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-paper hover:bg-brand-hover active:shadow-[var(--shadow-pressed)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-paper hover:opacity-90 active:shadow-[var(--shadow-pressed)]",
        outline:
          "border bg-background shadow-paper hover:bg-accent hover:text-accent-foreground active:shadow-[var(--shadow-pressed)]",
        secondary:
          "border border-border bg-bg-surface text-text-primary shadow-paper hover:bg-brand-muted/80 active:shadow-[var(--shadow-pressed)]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground active:translate-y-0 active:bg-accent/80",
        link: "text-primary underline-offset-4 hover:underline active:translate-y-0",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      data-slot="button"
      {...props}
    />
  );
}

export { Button, buttonVariants };
