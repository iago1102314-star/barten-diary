"use client";

import { ListeningIndicator } from "@/components/entrance/listening-indicator";
import { MasterLine } from "@/components/entrance/master-line";
import { BarButton } from "@/components/ui/bar-button";
import {
  canLeaveWithoutRecord,
  listenFailureMasterLines,
} from "@/lib/night/listen-failure";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const MASTER_ASIDES = [
  "……ゆっくりで、いい。",
  "……続けてくれ。",
  "……聞いている。",
  "……そのまま。",
] as const;

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
  const [aside, setAside] = useState<string | null>(null);

  useEffect(() => {
    if (listenFailureVisible || breathing || resuming) return;

    const showAside = () => {
      const line =
        MASTER_ASIDES[Math.floor(Math.random() * MASTER_ASIDES.length)];
      setAside(line);
      setTimeout(() => setAside(null), 3200);
    };

    const interval = setInterval(showAside, 9000);
    return () => clearInterval(interval);
  }, [listenFailureVisible, breathing, resuming]);

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
        <div className="flex flex-col items-center gap-5 pt-1">
          <BarButton variant="ghost" onClick={onRetrySpeaking}>
            もう一度話す
          </BarButton>
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
      <AnimatePresence mode="wait">
        {aside && (
          <motion.p
            key={aside}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 0.85, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="font-serif-jp text-center text-[13px] tracking-[0.08em] text-stone-300/80"
          >
            {aside}
          </motion.p>
        )}
      </AnimatePresence>
      {!aside && <ListeningIndicator />}
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
