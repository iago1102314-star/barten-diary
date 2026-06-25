"use client";

import { AfterNightBackdrop } from "@/components/entrance/after-night-backdrop";
import { Reveal } from "@/components/motion/reveal";
import { SceneFrame } from "@/components/entrance/scene-frame";
import { BarButton } from "@/components/ui/bar-button";
import { EASE_DRIFT } from "@/lib/entrance/motion-presets";
import type { NightAlleyOutcome } from "@/lib/entrance/night-outcome";
import { MEMORIES_EXIT_FADE_SEC, MEMORIES_RETURN_FADE_OUT_SEC } from "@/lib/entrance/start-entry-timing";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

const COMPOSING_SLOW_HINT_MS = 20_000;

type NightAlleyScreenProps = {
  outcome: NightAlleyOutcome;
  onDismiss: () => void;
  /** パイプラインエラー後 — 録音からやり直す */
  onRetry?: () => void;
  onOpenDiary?: (diaryId: string) => void;
  diaryFadeOut?: boolean;
  onDiaryFadeOutComplete?: () => void;
  homeFadeOut?: boolean;
  onHomeFadeOutComplete?: () => void;
};

const outcomeTextClass =
  "font-serif-jp text-[15px] font-normal leading-[2] text-stone-200/85";

function useComposingElapsedMs(startedAt: number | undefined): number {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsedMs(0);
      return;
    }

    const tick = () => {
      setElapsedMs(Math.max(0, Math.round(performance.now() - startedAt)));
    };

    tick();
    const intervalId = window.setInterval(tick, 500);
    return () => window.clearInterval(intervalId);
  }, [startedAt]);

  return elapsedMs;
}

/** 夜を終えた後の帰り道 — 入口の雨路地とは別背景・より静か */
export function NightAlleyScreen({
  outcome,
  onDismiss,
  onRetry,
  onOpenDiary,
  diaryFadeOut = false,
  onDiaryFadeOutComplete,
  homeFadeOut = false,
  onHomeFadeOutComplete,
}: NightAlleyScreenProps) {
  const composingStartedAt =
    outcome.kind === "composing" ? outcome.startedAt : undefined;
  const composingElapsedMs = useComposingElapsedMs(composingStartedAt);
  const showSlowHint = composingElapsedMs >= COMPOSING_SLOW_HINT_MS;

  return (
    <SceneFrame>
      <AfterNightBackdrop />

      <div className="absolute inset-0 z-30 flex flex-col items-center justify-end px-8 pb-[22%] pt-16">
        <div className="w-full max-w-xs space-y-9 text-center">
          {outcome.kind === "composing" && (
            <>
              <Reveal delay={0.6} duration={1.6}>
                <p className={outcomeTextClass}>
                  今夜の記録を綴っています…
                </p>
              </Reveal>
              {showSlowHint ? (
                <Reveal delay={0.2} duration={1.4}>
                  <p className={outcomeTextClass}>
                    少し時間がかかっています。
                  </p>
                </Reveal>
              ) : null}
            </>
          )}

          {outcome.kind === "saved" && (
            <>
              <Reveal delay={0.7} duration={1.7}>
                <p className={outcomeTextClass}>今夜のメモを残しました。</p>
              </Reveal>
              <Reveal
                delay={1.8}
                duration={1.4}
                className="flex flex-col items-center gap-6"
              >
                <BarButton
                  variant="ghost"
                  onClick={() => onOpenDiary?.(outcome.diaryId)}
                >
                  記録を開く
                </BarButton>
                <BarButton variant="quiet" onClick={onDismiss}>
                  また今度読む
                </BarButton>
              </Reveal>
            </>
          )}

          {outcome.kind === "devSaved" && (
            <>
              <Reveal delay={0.7} duration={1.7}>
                <p className={outcomeTextClass}>今夜のメモを残しました。</p>
              </Reveal>
              <Reveal delay={1.3}>
                <p className="text-[10px] tracking-[0.1em] text-stone-500/60">
                  （DEV — 今回は保存していません）
                </p>
              </Reveal>
              <Reveal delay={1.8}>
                <BarButton variant="quiet" onClick={onDismiss}>
                  また今度読む
                </BarButton>
              </Reveal>
            </>
          )}

          {outcome.kind === "saveFailed" && (
            <>
              <Reveal delay={0.7} duration={1.7}>
                <p className={outcomeTextClass}>
                  今夜は記録を残せなかった。
                </p>
              </Reveal>
              <Reveal
                delay={1.8}
                duration={1.4}
                className="flex flex-col items-center gap-6"
              >
                {onRetry ? (
                  <BarButton variant="ghost" onClick={onRetry}>
                    もう一度話す
                  </BarButton>
                ) : null}
                <BarButton variant="quiet" onClick={onDismiss}>
                  また今度読む
                </BarButton>
              </Reveal>
            </>
          )}

          {outcome.kind === "unsaved" && (
            <Reveal delay={0.9} duration={1.5}>
              <BarButton variant="quiet" onClick={onDismiss}>
                また今度読む
              </BarButton>
            </Reveal>
          )}
        </div>
      </div>

      {(diaryFadeOut || homeFadeOut) && (
        <motion.div
          className="absolute inset-0 z-[60] bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: homeFadeOut
              ? MEMORIES_RETURN_FADE_OUT_SEC
              : MEMORIES_EXIT_FADE_SEC,
            ease: EASE_DRIFT,
          }}
          onAnimationComplete={
            homeFadeOut ? onHomeFadeOutComplete : onDiaryFadeOutComplete
          }
        />
      )}
    </SceneFrame>
  );
}
