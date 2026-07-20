import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { PracticeSessionSkeleton } from "@/components/PracticeSessionSkeleton";
import { ContentCrossfade } from "@/components/motion/ContentCrossfade";
import { ReciteComplete } from "@/components/ReciteComplete";
import { RecitePlayer } from "@/components/RecitePlayer";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/useAppToast";
import { useAuth } from "@/hooks/useAuth";
import { useReciteSession } from "@/hooks/useReciteSession";

export function RecitePage() {
  const { bankId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const numericBankId = Number(bankId);
  const session = useReciteSession(numericBankId, isAuthenticated);
  const { error: showError } = useAppToast();

  useEffect(() => {
    if (session.error) {
      showError(session.error);
    }
  }, [session.error, showError]);

  if (session.status === "complete") {
    return (
      <ReciteComplete
        knownCount={session.stats.knownCount}
        onPrimary={() => navigate(isAuthenticated ? "/app/banks" : "/")}
        onRetryAll={() => session.restart()}
        onRetryReview={() => session.restart("review")}
        primaryLabel={isAuthenticated ? "返回题库" : "返回大厅"}
        reviewCount={session.stats.reviewCount}
        title="本次背题完成"
        total={session.stats.total}
        unansweredCount={session.stats.unansweredCount}
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
        : `content-${numericBankId}`;

  return (
    <ContentCrossfade className="min-h-screen" stateKey={viewKey}>
      {isInitialLoading ? (
        <PracticeSessionSkeleton />
      ) : session.status === "error" && session.error ? (
        <main className="min-h-screen px-6 py-12">
          <div className="mx-auto max-w-3xl space-y-4">
            <ErrorState
              backHref={isAuthenticated ? "/app/banks" : "/"}
              backLabel={isAuthenticated ? "返回题库" : "返回大厅"}
              message={session.error}
              onRetry={() => void session.reload()}
            />
            <div className="flex justify-center">
              <Button asChild variant="outline">
                <Link to={isAuthenticated ? "/app/banks" : "/"}>返回</Link>
              </Button>
            </div>
          </div>
        </main>
      ) : session.questions.length === 0 ? (
        <main className="min-h-screen px-6 py-12">
          <div className="mx-auto max-w-3xl space-y-4">
            <EmptyState
              description="这个题库暂时没有可背诵的题目。"
              title="暂无题目"
            />
            <div className="flex justify-center">
              <Button asChild variant="outline">
                <Link to={isAuthenticated ? "/app/banks" : "/"}>返回</Link>
              </Button>
            </div>
          </div>
        </main>
      ) : (
        <RecitePlayer
          bankId={numericBankId}
          bankTitle={session.bankTitle}
          currentIndex={session.workingIndex}
          onMark={session.markCurrent}
          onPrev={session.goPrev}
          questions={session.questions}
        />
      )}
    </ContentCrossfade>
  );
}
