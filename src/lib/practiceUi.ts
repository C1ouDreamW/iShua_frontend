import { cn } from "@/lib/utils";

export function paperSheetClasses(extra?: string) {
  return cn(
    "paper-sheet paper-ruled rounded-lg border border-border p-6",
    extra,
  );
}

export function practiceOptionClasses(selected: boolean) {
  return cn(
    "flex w-full items-start gap-3 rounded-md border bg-bg-sheet p-4 text-left",
    "transition-[border-color,background-color,transform] duration-100 ease-out",
    "hover:border-brand/50 active:translate-y-px disabled:cursor-not-allowed",
    "border-l-[3px]",
    selected
      ? "border-brand border-l-brand bg-[color-mix(in_srgb,var(--bg-sheet)_88%,var(--brand-muted))]"
      : "border-border border-l-border",
  );
}

export function practiceOptionMarkerClasses(selected: boolean) {
  return cn(
    "flex size-7 shrink-0 items-center justify-center rounded-md border text-sm font-semibold tabular-nums",
    selected
      ? "border-brand bg-brand text-primary-foreground"
      : "border-border bg-bg-surface text-brand",
  );
}

export function practiceTypeBadgeClasses() {
  return cn(
    "rounded-md border border-border bg-bg-surface px-2.5 py-0.5 text-xs font-medium text-brand",
  );
}

export function practiceAnalysisClasses() {
  return cn(
    "mt-8 border-l-[3px] border-brand bg-[color-mix(in_srgb,var(--bg-sheet)_90%,var(--brand-muted))] py-4 pl-4",
    "motion-safe:transition-opacity motion-safe:duration-200",
  );
}

export function practiceFooterClasses() {
  return cn(
    "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg-surface/95 backdrop-blur-sm pb-safe",
  );
}

export function practiceFooterInnerClasses() {
  return cn(
    "mx-auto grid max-w-3xl grid-cols-3 gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4",
    "[&_button]:min-w-0 [&_button]:px-2 sm:[&_button]:px-4",
  );
}
