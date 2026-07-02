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

/** 背题模式选项：正确选项高亮成功色，错误选项弱化。 */
export function reciteOptionClasses(correct: boolean) {
  return cn(
    "flex w-full items-start gap-3 rounded-md border bg-bg-sheet p-4 text-left border-l-[3px]",
    "transition-[border-color,background-color,opacity] duration-100",
    correct
      ? "border-success border-l-success bg-success-bg"
      : "border-border border-l-border opacity-55",
  );
}

export function reciteOptionMarkerClasses(correct: boolean) {
  return cn(
    "flex size-7 shrink-0 items-center justify-center rounded-md border text-sm font-semibold tabular-nums",
    correct
      ? "border-success bg-success text-primary-foreground"
      : "border-border bg-bg-surface text-text-muted",
  );
}

export function reciteProgressBarClasses() {
  return cn("h-1 w-full bg-bg-canvas");
}

export function reciteProgressFillClasses() {
  return cn(
    "h-full bg-brand transition-[width] duration-200 ease-out",
    "motion-safe:transition-[width]",
  );
}
