"use client";

import { MasterLine } from "@/components/entrance/master-line";
import { BarButton } from "@/components/ui/bar-button";
import {
  canLeaveWithoutRecord,
  resolveListenFailureLines,
  shouldOfferRetryAfterListenFailure,
} from "@/lib/night/listen-failure";

type RecordingPanelProps = {
  listenFailureCount: number;
  listenFailureVisible: boolean;
  listenFailureReason?: string | null;
  onRetrySpeaking: () => void;
  onLeaveWithoutRecord: () => void;
};

/** 録音中 — 聞き取り失敗時のマスター台詞とリトライ */
export function RecordingPanel({
  listenFailureCount,
  listenFailureVisible,
  listenFailureReason = null,
  onRetrySpeaking,
  onLeaveWithoutRecord,
}: RecordingPanelProps) {
  if (!listenFailureVisible) {
    return null;
  }

  const lines = resolveListenFailureLines(listenFailureCount, listenFailureReason);
  const showLeave = canLeaveWithoutRecord(listenFailureCount);
  const showRetry = shouldOfferRetryAfterListenFailure(listenFailureReason);

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        {lines.map((line) => (
          <MasterLine key={line}>{line}</MasterLine>
        ))}
      </div>
      <div className="flex flex-col items-center gap-5 pt-1">
        {showRetry && (
          <BarButton variant="quiet" onClick={onRetrySpeaking}>
            もう一度話す
          </BarButton>
        )}
        {showLeave && (
          <BarButton variant="quiet" onClick={onLeaveWithoutRecord}>
            今夜はこの辺にしておく
          </BarButton>
        )}
      </div>
    </div>
  );
}
