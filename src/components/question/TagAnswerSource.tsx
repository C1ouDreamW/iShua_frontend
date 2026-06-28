import {
  ANSWER_CONFIDENCE_LABEL,
  ANSWER_SOURCE_LABEL,
  type AnswerConfidence,
  normalizeAnswerSource,
} from "@/lib/aiImport";
import { cn } from "@/lib/utils";

type TagAnswerSourceProps = {
  source?: string | null;
  confidence?: string | null;
  className?: string;
};

export function TagAnswerSource({
  source,
  confidence,
  className,
}: TagAnswerSourceProps) {
  const normalized = normalizeAnswerSource(source);

  if (normalized === "ORIGINAL") {
    return null;
  }

  const isLow = confidence?.toUpperCase() === "LOW";

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span
        className={cn(
          "rounded-md border px-1.5 py-0.5 text-xs font-medium",
          normalized === "MISSING"
            ? "border-warning/40 bg-warning/10 text-warning"
            : "border-brand/40 bg-brand-muted text-brand",
        )}
      >
        {ANSWER_SOURCE_LABEL[normalized]}
      </span>
      {normalized === "AI_GENERATED" && confidence ? (
        <span
          className={cn(
            "rounded-md border px-1.5 py-0.5 text-xs font-medium",
            isLow
              ? "border-error/40 bg-error/10 text-error"
              : "border-border bg-bg-surface text-text-secondary",
          )}
        >
          {ANSWER_CONFIDENCE_LABEL[confidence.toUpperCase() as AnswerConfidence] ?? confidence}
        </span>
      ) : null}
    </span>
  );
}
