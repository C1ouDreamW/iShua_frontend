import type { PracticeQuestion } from "@/api/practice";
import { PracticePlayerCore } from "@/components/PracticePlayerCore";
import type { PracticeAnswerRecord } from "@/hooks/usePracticeSession";
import { useAuth } from "@/hooks/useAuth";
import { buildRecitePath } from "@/lib/navigation";
import { Link } from "react-router-dom";

type PracticePlayerProps = {
  bankId: number;
  bankTitle: string;
  questions: PracticeQuestion[];
  currentIndex: number;
  record: PracticeAnswerRecord | undefined;
  onIndexChange: (index: number) => void;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  onComplete: () => void;
  showWrongToast: boolean;
  onDismissWrongToast: () => void;
  autoNext: boolean;
  onToggleAutoNext: () => void;
};

export function PracticePlayer({
  bankId,
  bankTitle,
  questions,
  currentIndex,
  record,
  onIndexChange,
  onAnswerChange,
  onSubmit,
  onComplete,
  showWrongToast,
  onDismissWrongToast,
  autoNext,
  onToggleAutoNext,
}: PracticePlayerProps) {
  const { isAuthenticated } = useAuth();

  return (
    <PracticePlayerCore
      autoNext={autoNext}
      currentIndex={currentIndex}
      enableKeyboardNav
      exitTo={isAuthenticated ? "/app/banks" : "/"}
      headerExtra={
        <Link
          className="text-xs text-brand underline-offset-4 hover:underline"
          to={buildRecitePath(bankId, isAuthenticated)}
        >
          切换背题模式
        </Link>
      }
      isAnswerEmpty={!record || record.answer.length === 0}
      onAnswerChange={onAnswerChange}
      onComplete={onComplete}
      onDismissWrongToast={onDismissWrongToast}
      onIndexChange={onIndexChange}
      onSubmit={onSubmit}
      onToggleAutoNext={onToggleAutoNext}
      questions={questions}
      record={record}
      showWrongToast={showWrongToast}
      title={bankTitle}
    />
  );
}
