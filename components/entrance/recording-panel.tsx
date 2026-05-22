"use client";

import { MasterLine } from "@/components/entrance/master-line";
import {
  canLeaveWithoutRecord,
  listenFailureMasterLines,
} from "@/lib/night/listen-failure";
import { useEffect, useState } from "react";

type RecordingPanelProps = {
  listenFailureCount: number;
  listenFailureVisible: boolean;
  onFinish: () => void;
  onRetrySpeaking: () => void;
  onLeaveWithoutRecord: () => void;
  onPauseSpeaking: () => boolean;
  onResumeSpeaking: () => boolean;
};

export function RecordingPanel({
  listenFailureCount,
  listenFailureVisible,
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

  if (listenFailureVisible && listenFailureCount > 0) {
    const lines = listenFailureMasterLines(listenFailureCount);
    const showLeave = canLeaveWithoutRecord(listenFailureCount);

    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          {lines.map((line) => (
            <MasterLine key={line}>{line}</MasterLine>
          ))}
        </div>
        <div className="flex flex-col items-center gap-4 pt-1">
          <button
            type="button"
            onClick={onRetrySpeaking}
            className="text-[12px] tracking-[0.18em] text-stone-300/90 transition-colors hover:text-stone-200"
          >
            もう一度話す
          </button>
          {showLeave && (
            <button
              type="button"
              onClick={onLeaveWithoutRecord}
              className="text-[12px] tracking-[0.18em] text-stone-500/85 transition-colors hover:text-stone-400"
            >
              今夜はこの辺にしておく
            </button>
          )}
        </div>
      </div>
    );
  }

  if (breathing) {
    return (
      <div className="space-y-6 text-center">
        <MasterLine>……構わないよ。ゆっくりしていってくれ。</MasterLine>
        <button
          type="button"
          onClick={() => {
            if (recorderPaused) {
              onResumeSpeaking();
              setRecorderPaused(false);
            }
            setBreathing(false);
            setResuming(true);
          }}
          className="text-[12px] tracking-[0.18em] text-stone-400/90 transition-colors hover:text-stone-300"
        >
          話に戻る
        </button>
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
    <div className="flex flex-col items-center gap-5">
      <button
        type="button"
        onClick={() => {
          const didPause = onPauseSpeaking();
          setRecorderPaused(didPause);
          setBreathing(true);
        }}
        className="text-[12px] tracking-[0.18em] text-stone-500/85 transition-colors hover:text-stone-400"
      >
        一息つく
      </button>
      <button
        type="button"
        onClick={onFinish}
        className="rounded-full border border-stone-700/45 bg-stone-950/50 px-8 py-2.5 text-sm tracking-wide text-stone-300/90 backdrop-blur-sm transition-colors hover:border-stone-600/55 hover:text-stone-200"
      >
        今日はこの辺にしておく
      </button>
    </div>
  );
}
