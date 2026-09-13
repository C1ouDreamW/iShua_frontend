import { cn } from "@/lib/utils";

export function paperSheetClasses(extra?: string) {
  return cn(
    "paper-sheet paper-ruled rounded-lg border border-border p-4 sm:p-6",
    extra,
  );
}

export type PracticeOptionState =
  | "idle"
  | "selected"
  | "correct"
  | "wrong"
  | "dimmed";

export function resolvePracticeOptionState({
  correct,
  selected,
  submitted,
}: {
  correct: boolean;
  selected: boolean;
  submitted: boolean;
}): PracticeOptionState {
  if (!submitted) {
    return selected ? "selected" : "idle";
  }

  if (correct) {
    return "correct";
  }

  return selected ? "wrong" : "dimmed";
}

export function practiceOptionClasses(state: PracticeOptionState) {
  return cn(
    "flex w-full items-start gap-3 rounded-md border bg-bg-sheet p-4 text-left",
    "transition-[border-color,background-color,transform] duration-100 ease-out",
    "hover:border-brand/50 active:translate-y-px disabled:cursor-not-allowed",
    "border-l-[3px]",
    state === "selected" &&
      "border-brand border-l-brand bg-[color-mix(in_srgb,var(--bg-sheet)_88%,var(--brand-muted))]",
    state === "correct" && "border-success border-l-success bg-success-bg",
    state === "wrong" && "border-error border-l-error bg-error-bg",
    state === "dimmed" && "border-border border-l-border opacity-60",
    state === "idle" && "border-border border-l-border",
  );
}

export function practiceOptionMarkerClasses(state: PracticeOptionState) {
  return cn(
    "flex size-7 shrink-0 items-center justify-center rounded-md border text-sm font-semibold tabular-nums",
    state === "selected" && "border-brand bg-brand text-primary-foreground",
    state === "correct" && "border-success bg-success text-primary-foreground",
    state === "wrong" && "border-error bg-error text-primary-foreground",
    (state === "idle" || state === "dimmed") &&
      "border-border bg-bg-surface text-brand",
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
