import { Link } from "react-router-dom";

import type { Question } from "@/api/questions";
import { TagQuestionType } from "@/components/question/TagQuestionType";
import { Button } from "@/components/ui/button";

type QuestionListProps = {
  bankId: number;
  questions: Question[];
  onDelete: (question: Question) => void;
};

export function QuestionList({
  bankId,
  questions,
  onDelete,
}: QuestionListProps) {
  return (
    <ul className="flex flex-col gap-3">
      {questions.map((question) => (
        <li
          className="rounded-xl border bg-bg-surface p-4 shadow-sm"
          key={question.id ?? `${question.stem}-${question.sortNo}`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <TagQuestionType type={question.questionType} />
                {question.sortNo != null ? (
                  <span className="text-xs text-text-muted">
                    排序 {question.sortNo}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 line-clamp-1 text-[15px] leading-7 text-text-primary">
                {question.stem || "（无题干）"}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button asChild size="sm" variant="outline">
                <Link
                  to={`/app/manage/banks/${bankId}/questions/${question.id}/edit`}
                >
                  编辑
                </Link>
              </Button>
              <Button
                onClick={() => onDelete(question)}
                size="sm"
                variant="ghost"
              >
                删除
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
