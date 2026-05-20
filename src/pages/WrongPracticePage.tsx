import { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { PracticeComplete } from "@/components/PracticeComplete";
import { WrongPracticePlayer } from "@/components/WrongPracticePlayer";
import { Button } from "@/components/ui/button";
import { useWrongPracticeSession } from "@/hooks/useWrongPracticeSession";

export function WrongPracticePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bankIdParam = searchParams.get("bankId");
  const filterBankId = useMemo(() => {
    if (!bankIdParam) {
      return undefined;
    }

    const parsed = Number(bankIdParam);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [bankIdParam]);

  const session = useWrongPracticeSession(filterBankId);

  if (session.status === "complete") {
    return (
      <PracticeComplete
        correctCount={session.stats.correctCount}
        onPrimary={() => navigate("/app/wrong-questions")}
        onRetry={session.restart}
        primaryLabel="返回错题本"
        title="错题重刷完成"
        unansweredCount={session.stats.unansweredCount}
        wrongCount={session.stats.wrongCount}
      />
    );
  }

  if (session.status === "loading") {
    return (
      <main className="min-h-screen bg-bg-canvas px-6 py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div className="h-16 animate-pulse rounded-xl border bg-bg-surface" />
          <div className="h-[520px] animate-pulse rounded-2xl border bg-bg-surface" />
        </div>
      </main>
    );
  }

  if (session.status === "error" && session.error) {
    return (
      <main className="min-h-screen bg-bg-canvas px-6 py-12">
        <div className="mx-auto max-w-3xl space-y-4">
          <ErrorState
            message={session.error}
            onRetry={() => void session.reload()}
          />
          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/app/wrong-questions">返回错题本</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (session.questions.length === 0) {
    return (
      <main className="min-h-screen bg-bg-canvas px-6 py-12">
        <div className="mx-auto max-w-3xl space-y-4">
          <EmptyState description="先去刷题答错几道题再来吧。" title="暂无错题" />
          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/app/wrong-questions">返回错题本</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <WrongPracticePlayer
      currentIndex={session.currentIndex}
      onAnswerChange={session.updateAnswer}
      onComplete={session.complete}
      onIndexChange={session.setCurrentIndex}
      onSubmit={() => void session.submitCurrent()}
      questions={session.questions}
      record={session.records[session.currentIndex]}
      submitError={session.submitError}
    />
  );
}
