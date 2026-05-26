import logoUrl from "../../assets/logo/logo.webp";
import { cn } from "@/lib/utils";

type LogoMarkProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  faded?: boolean;
};

const sizeClass: Record<NonNullable<LogoMarkProps["size"]>, string> = {
  lg: "size-16 rounded-md",
  md: "size-20 rounded-lg",
  sm: "size-12 rounded-md",
};

export function LogoMark({ size = "md", className, faded = false }: LogoMarkProps) {
  return (
    <img
      alt="iShua"
      className={cn(
        sizeClass[size],
        "border border-border object-contain shadow-paper",
        faded && "opacity-40 grayscale",
        className,
      )}
      decoding="async"
      src={logoUrl}
    />
  );
}
