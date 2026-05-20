import logoUrl from "../../assets/logo/logo.webp";
import { cn } from "@/lib/utils";

type LogoMarkProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  faded?: boolean;
};

const sizeClass: Record<NonNullable<LogoMarkProps["size"]>, string> = {
  lg: "size-16 rounded-2xl",
  md: "size-20 rounded-3xl",
  sm: "size-12 rounded-xl",
};

export function LogoMark({ size = "md", className, faded = false }: LogoMarkProps) {
  return (
    <img
      alt="iShua"
      className={cn(
        sizeClass[size],
        "object-contain shadow-sm",
        faded && "opacity-40 grayscale",
        className,
      )}
      decoding="async"
      src={logoUrl}
    />
  );
}
