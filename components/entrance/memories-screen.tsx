"use client";

import { AfterNightBackdrop } from "@/components/entrance/after-night-backdrop";
import { Haze } from "@/components/entrance/atmosphere";
import { SceneFrame } from "@/components/entrance/scene-frame";
import { StartSteadyLampGlowLayer } from "@/components/entrance/start-steady-lamp-glow-layer";
import { MemoList } from "@/components/memories/memo-list";
import { MemoDetailPanel } from "@/components/memories/memo-detail-panel";
import { BarButton } from "@/components/ui/bar-button";
import type { DiaryListItem } from "@/components/diaries/diary-list";
import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import { EASE_DRIFT } from "@/lib/entrance/motion-presets";
import type { MemoriesBackdrop } from "@/lib/entrance/memories-launch";
import {
  MEMORIES_BG_FADE_IN_SEC,
  MEMORIES_RETURN_FADE_OUT_SEC,
} from "@/lib/entrance/start-entry-timing";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type MemoriesScreenProps = {
  onBack: () => void;
  backdrop?: MemoriesBackdrop;
  /** 指定時は一覧を飛ばしてその記録を開く（帰り道からなど） */
  initialDiaryId?: string;
};

const sceneFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, filter: "blur(6px)" },
  transition: { duration: 0.9 },
} as const;

const contentFadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: MEMORIES_BG_FADE_IN_SEC, ease: EASE_DRIFT },
} as const;

/** 路地で過去の記録を振り返る — ページ遷移なし */
export function MemoriesScreen({
  onBack,
  backdrop = "entry",
  initialDiaryId,
}: MemoriesScreenProps) {
  const [memos, setMemos] = useState<DiaryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemo, setSelectedMemo] = useState<DiaryListItem | null>(null);
  const [exiting, setExiting] = useState(false);
  const directOpen = Boolean(initialDiaryId);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        if (initialDiaryId) {
          const res = await fetch(`/api/memories/${initialDiaryId}`);
          const data = (await res.json()) as {
            diary?: DiaryListItem;
            error?: string;
          };

          if (cancelled) return;

          if (!res.ok || !data.diary) {
            setError(data.error ?? "記録を開けませんでした。");
            return;
          }

          setSelectedMemo(data.diary);
          setMemos([data.diary]);
          return;
        }

        const res = await fetch("/api/memories");
        const data = (await res.json()) as {
          diaries?: DiaryListItem[];
          error?: string;
        };

        if (cancelled) return;

        if (!res.ok) {
          setError(data.error ?? "夜のメモを開けませんでした。");
          return;
        }

        setMemos(data.diaries ?? []);
      } catch {
        if (!cancelled) {
          setError("夜のメモを開けませんでした。");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialDiaryId]);

  const refreshMemo = useCallback(async (id: string) => {
    const res = await fetch(`/api/memories/${id}`);
    const data = (await res.json()) as {
      diary?: DiaryListItem;
      error?: string;
    };

    if (!res.ok || !data.diary) return;

    setSelectedMemo(data.diary);
    setMemos((prev) =>
      prev.map((memo) => (memo.id === data.diary!.id ? data.diary! : memo)),
    );
  }, []);

  const handleOpenMemo = useCallback((memo: DiaryListItem) => {
    setSelectedMemo(memo);
  }, []);

  const handleBackToAlley = useCallback(() => {
    if (exiting) return;
    setExiting(true);
  }, [exiting]);

  const handleBackToList = useCallback(() => {
    if (directOpen) {
      handleBackToAlley();
      return;
    }
    setSelectedMemo(null);
  }, [directOpen, handleBackToAlley]);

  const backFromScreenLabel =
    backdrop === "afterNight" ? "帰り道に戻る" : "路地に戻る";

  return (
    <SceneFrame>
      {backdrop === "afterNight" ? (
        <AfterNightBackdrop
          motionProps={{
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: MEMORIES_BG_FADE_IN_SEC, ease: EASE_DRIFT },
          }}
        />
      ) : (
        <EntryAlleyBackdrop />
      )}

      <motion.div
        className="pointer-events-none absolute inset-0 z-40 bg-black"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: MEMORIES_BG_FADE_IN_SEC, ease: EASE_DRIFT }}
      />

      <motion.div
        {...contentFadeIn}
        className={`absolute inset-0 z-30 flex flex-col ${
          exiting ? "pointer-events-none" : ""
        }`}
      >
        <AnimatePresence mode="wait">
          {selectedMemo ? (
            <motion.div
              key={`detail-${selectedMemo.id}`}
              {...sceneFade}
              className="flex min-h-0 flex-1 flex-col"
            >
              <header className="shrink-0 space-y-3 px-7 pb-4 pt-[12%]">
                <BarButton variant="ghost" onClick={handleBackToList}>
                  {directOpen ? backFromScreenLabel : "一覧に戻る"}
                </BarButton>
              </header>

              <div className="flex-1 overflow-y-auto overscroll-contain px-7 pb-[14%]">
                <MemoDetailPanel
                  diary={selectedMemo}
                  onPersisted={() => void refreshMemo(selectedMemo.id)}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div key="list" className="flex min-h-0 flex-1 flex-col">
              <header className="shrink-0 space-y-3 px-7 pb-4 pt-[12%]">
                <BarButton variant="ghost" onClick={handleBackToAlley}>
                  {backFromScreenLabel}
                </BarButton>
                <div className="space-y-2 pt-2">
                  <h1 className="font-serif-jp text-xl font-normal tracking-[0.14em] text-stone-200/90">
                    夜のメモ
                  </h1>
                  <p className="font-serif-jp text-[12px] leading-relaxed tracking-[0.06em] text-stone-500/90">
                    帰り道で、自分用に残した記録。
                  </p>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto overscroll-contain px-7 pb-[14%]">
                {loading && (
                  <p className="py-16 text-center text-[11px] tracking-[0.2em] text-stone-600/80">
                    ……
                  </p>
                )}

                {!loading && error && (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-3 text-sm text-red-200/80"
                  >
                    {error}
                  </p>
                )}

                {!loading && !error && (
                  <MemoList memos={memos} onOpenMemo={handleOpenMemo} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {exiting && (
        <motion.div
          className="absolute inset-0 z-50 bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: MEMORIES_RETURN_FADE_OUT_SEC, ease: EASE_DRIFT }}
          onAnimationComplete={onBack}
        />
      )}
    </SceneFrame>
  );
}

function EntryAlleyBackdrop() {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: MEMORIES_BG_FADE_IN_SEC, ease: EASE_DRIFT }}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1, x: 0 }}
        animate={{ scale: 1, x: 0 }}
      >
        <Image
          src={ENTRANCE_ASSETS.start}
          alt=""
          fill
          priority
          sizes="440px"
          className="object-cover"
          style={{ objectPosition: "60% 50%" }}
          draggable={false}
          unoptimized
        />

        <StartSteadyLampGlowLayer />
      </motion.div>

      <Haze y={36} intensity={1} />
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/40 via-transparent to-stone-950/80" />
      <div className="absolute inset-0 bg-[#0a1020]/20 mix-blend-multiply" />
    </motion.div>
  );
}
