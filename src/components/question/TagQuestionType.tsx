import {
  QUESTION_TYPE_LABEL,
  type QuestionType,
} from "@/lib/questionForm";
import { cn } from "@/lib/utils";

type TagQuestionTypeProps = {
  type?: string;
  className?: string;
};

export function TagQuestionType({ type, className }: TagQuestionTypeProps) {
  const label =
    type && type in QUESTION_TYPE_LABEL
      ? QUESTION_TYPE_LABEL[type as QuestionType]
      : "题目";

  return (
    <span
      className={cn(
        "rounded-md border border-border bg-bg-sheet px-2 py-0.5 text-xs font-medium text-brand",
        className,
      )}
    >
      {label}
    </span>
  );
}
