"use client";

import { MasterLine } from "@/components/entrance/master-line";
import { BarButton } from "@/components/ui/bar-button";
import {
  canLeaveWithoutRecord,
  resolveListenFailureLines,
  shouldOfferRetryAfterListenFailure,
} from "@/lib/night/listen-failure";
import { useEffect, useState } from "react";

type RecordingPanelProps = {
  listenFailureCount: number;
  listenFailureVisible: boolean;
  listenFailureReason?: string | null;
  onFinish: () => void;
  onRetrySpeaking: () => void;
  onLeaveWithoutRecord: () => void;
  onPauseSpeaking: () => boolean;
  onResumeSpeaking: () => boolean;
};

export function RecordingPanel({
  listenFailureCount,
  listenFailureVisible,
  listenFailureReason = null,
  onFinish,
  onRetrySpeaking,
  onLeaveWithoutRecord,
  onPauseSpeaking,
  onResumeSpeaking,
}: RecordingPanelProps) {
  const [breathing, setBreathing] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [recorderPaused, setRecorderPaused] = useState(false);

  useEffect(() => {
    if (!listenFailureVisible) return;
    setBreathing(false);
    setResuming(false);
    setRecorderPaused(false);
  }, [listenFailureVisible, listenFailureCount]);

  useEffect(() => {
    if (!resuming) return;
    const timer = setTimeout(() => setResuming(false), 1200);
    return () => clearTimeout(timer);
  }, [resuming]);

  if (listenFailureVisible) {
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
            <BarButton variant="ghost" onClick={onRetrySpeaking}>
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

  if (breathing) {
    return (
      <div className="space-y-7 text-center">
        <MasterLine>……構わないよ。ゆっくりしていってくれ。</MasterLine>
        <BarButton
          variant="ghost"
          onClick={() => {
            if (recorderPaused) {
              onResumeSpeaking();
              setRecorderPaused(false);
            }
            setBreathing(false);
            setResuming(true);
          }}
        >
          話に戻る
        </BarButton>
      </div>
    );
  }

  if (resuming) {
    return (
      <div className="text-center">
        <MasterLine>……続きを聞かせてくれ。</MasterLine>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="mx-auto w-full max-w-[230px]">
        <BarButton variant="primary" onClick={onFinish}>
          今日はこの辺にしておく
        </BarButton>
      </div>
      <BarButton
        variant="quiet"
        onClick={() => {
          const didPause = onPauseSpeaking();
          setRecorderPaused(didPause);
          setBreathing(true);
        }}
      >
        一息つく
      </BarButton>
    </div>
  );
}
