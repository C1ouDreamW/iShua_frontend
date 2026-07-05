import type { PracticeQuestion } from "@/api/practice";
import { PracticePlayerCore } from "@/components/PracticePlayerCore";
import type { PracticeAnswerRecord } from "@/hooks/usePracticeSession";

type WrongPracticePlayerProps = {
  questions: PracticeQuestion[];
  currentIndex: number;
  record: PracticeAnswerRecord | undefined;
  onIndexChange: (index: number) => void;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  onComplete: () => void;
  autoNext: boolean;
  onToggleAutoNext: () => void;
};

export function WrongPracticePlayer({
  questions,
  currentIndex,
  record,
  onIndexChange,
  onAnswerChange,
  onSubmit,
  onComplete,
  autoNext,
  onToggleAutoNext,
}: WrongPracticePlayerProps) {
  return (
    <PracticePlayerCore
      autoNext={autoNext}
      currentIndex={currentIndex}
      enableKeyboardNav
      exitTo="/app/wrong-questions"
      isAnswerEmpty={!record || record.answer.length === 0}
      onAnswerChange={onAnswerChange}
      onComplete={onComplete}
      onIndexChange={onIndexChange}
      onSubmit={onSubmit}
      onToggleAutoNext={onToggleAutoNext}
      questions={questions}
      record={record}
      title="错题重刷"
    />
  );
}
