"use client";

import { Haze, LampGlow } from "@/components/entrance/atmosphere";
import { SceneFrame } from "@/components/entrance/scene-frame";
import { MemoList } from "@/components/memories/memo-list";
import { MemoDetailPanel } from "@/components/memories/memo-detail-panel";
import { BarButton } from "@/components/ui/bar-button";
import type { DiaryListItem } from "@/components/diaries/diary-list";
import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type MemoriesScreenProps = {
  onBack: () => void;
};

const sceneFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, filter: "blur(6px)" },
  transition: { duration: 0.9 },
} as const;

/** 路地で過去の記録を振り返る — ページ遷移なし */
export function MemoriesScreen({ onBack }: MemoriesScreenProps) {
  const [memos, setMemos] = useState<DiaryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemo, setSelectedMemo] = useState<DiaryListItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
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
  }, []);

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

  const handleBackToList = useCallback(() => {
    setSelectedMemo(null);
  }, []);

  return (
    <SceneFrame>
      <AlleyBackdrop />

      <div className="absolute inset-0 z-30 flex flex-col">
        <AnimatePresence mode="wait">
          {selectedMemo ? (
            <motion.div
              key={`detail-${selectedMemo.id}`}
              {...sceneFade}
              className="flex min-h-0 flex-1 flex-col"
            >
              <header className="shrink-0 space-y-3 px-7 pb-4 pt-[12%]">
                <BarButton variant="ghost" onClick={handleBackToList}>
                  一覧に戻る
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
            <motion.div
              key="list"
              {...sceneFade}
              className="flex min-h-0 flex-1 flex-col"
            >
              <motion.header
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 1 }}
                className="shrink-0 space-y-3 px-7 pb-4 pt-[12%]"
              >
                <BarButton variant="ghost" onClick={onBack}>
                  路地に戻る
                </BarButton>
                <div className="space-y-2 pt-2">
                  <h1 className="font-serif-jp text-xl font-normal tracking-[0.14em] text-stone-200/90">
                    夜のメモ
                  </h1>
                  <p className="font-serif-jp text-[12px] leading-relaxed tracking-[0.06em] text-stone-500/90">
                    帰り道で、自分用に残した記録。
                  </p>
                </div>
              </motion.header>

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
      </div>
    </SceneFrame>
  );
}

function AlleyBackdrop() {
  return (
    <>
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4 }}
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
      </motion.div>

      <LampGlow x={20} y={12} tone="cold" size={16} intensity={0.9} speed="7s" />
      <LampGlow x={31} y={39} tone="neon" size={10} intensity={1.6} speed="5s" />
      <LampGlow x={55} y={37} tone="warm" size={26} intensity={0.36} speed="5.5s" />
      <LampGlow x={68} y={37} tone="warm" size={24} intensity={0.32} speed="6.8s" />
      <Haze y={36} intensity={0.85} />

      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/55 via-stone-950/70 to-stone-950/90" />
      <div className="absolute inset-0 bg-[#0a1020]/30 mix-blend-multiply" />
    </>
  );
}
