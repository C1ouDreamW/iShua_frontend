import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { PracticeComplete } from "@/components/PracticeComplete";
import { PracticePlayer } from "@/components/PracticePlayer";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/useAppToast";
import { useAuth } from "@/hooks/useAuth";
import { usePracticeSession } from "@/hooks/usePracticeSession";

export function PracticePage() {
  const { bankId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const numericBankId = Number(bankId);
  const session = usePracticeSession(numericBankId);
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
        onPrimary={() => {
          navigate(isAuthenticated ? "/app/banks" : "/");
        }}
        onRetry={session.restart}
        title="本次练习完成"
        unansweredCount={session.stats.unansweredCount}
        wrongCount={session.stats.wrongCount}
      />
    );
  }

  if (session.status === "loading" && session.questions.length === 0) {
    return (
      <main className="min-h-screen px-6 py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div className="h-16 animate-pulse rounded-md border border-border bg-bg-surface" />
          <div className="h-[520px] animate-pulse rounded-lg border border-border bg-bg-sheet" />
        </div>
      </main>
    );
  }

  if (session.status === "error" && session.error) {
    return (
      <main className="min-h-screen px-6 py-12">
        <div className="mx-auto max-w-3xl space-y-4">
          <ErrorState
            backHref="/"
            message={session.error}
            onRetry={() => void session.reload()}
          />
          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/">返回大厅</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (session.questions.length === 0) {
    return (
      <main className="min-h-screen px-6 py-12">
        <div className="mx-auto max-w-3xl space-y-4">
          <EmptyState
            description="这个题库暂时没有可练习的题目。"
            title="暂无题目"
          />
          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/app/banks">返回</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <PageTransition>
      <PracticePlayer
        autoNext={session.autoNext}
        bankId={numericBankId}
        bankTitle={session.bankTitle}
        currentIndex={session.currentIndex}
        onAnswerChange={session.updateAnswer}
        onComplete={session.complete}
        onDismissWrongToast={session.dismissWrongToast}
        onIndexChange={session.setCurrentIndex}
        onSubmit={() => void session.submitCurrent()}
        onToggleAutoNext={() => session.setAutoNext((prev) => !prev)}
        questions={session.questions}
        record={session.records[session.currentIndex]}
        showWrongToast={session.showWrongToast}
      />
    </PageTransition>
  );
}
