import { useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { PracticeComplete } from "@/components/PracticeComplete";
import { PracticeSessionSkeleton } from "@/components/PracticeSessionSkeleton";
import { WrongPracticePlayer } from "@/components/WrongPracticePlayer";
import { ContentCrossfade } from "@/components/motion/ContentCrossfade";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/useAppToast";
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
  const { error: showError } = useAppToast();

  useEffect(() => {
    if (session.submitError) {
      showError(session.submitError);
    }
  }, [session.submitError, showError]);

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

  const isInitialLoading =
    session.status === "loading" && session.questions.length === 0;
  const viewKey = isInitialLoading
    ? "loading"
    : session.status === "error" && session.error
      ? "error"
      : session.questions.length === 0
        ? "empty"
        : `content-${filterBankId ?? "all"}`;

  return (
    <ContentCrossfade className="min-h-screen" stateKey={viewKey}>
      {isInitialLoading ? (
        <PracticeSessionSkeleton />
      ) : session.status === "error" && session.error ? (
        <main className="min-h-screen px-6 py-12">
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
      ) : session.questions.length === 0 ? (
        <main className="min-h-screen px-6 py-12">
          <div className="mx-auto max-w-3xl space-y-4">
            <EmptyState
              description="先去刷题答错几道题再来吧。"
              title="暂无错题"
            />
            <div className="flex justify-center">
              <Button asChild variant="outline">
                <Link to="/app/wrong-questions">返回错题本</Link>
              </Button>
            </div>
          </div>
        </main>
      ) : (
        <WrongPracticePlayer
          autoNext={session.autoNext}
          currentIndex={session.currentIndex}
          onAnswerChange={session.updateAnswer}
          onComplete={session.complete}
          onIndexChange={session.setCurrentIndex}
          onSubmit={() => void session.submitCurrent()}
          onToggleAutoNext={() => session.setAutoNext((prev) => !prev)}
          questions={session.questions}
          record={session.records[session.currentIndex]}
        />
      )}
    </ContentCrossfade>
  );
}
