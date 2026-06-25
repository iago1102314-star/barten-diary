"use client";

import { AfterNightBackdrop } from "@/components/entrance/after-night-backdrop";
import { Reveal } from "@/components/motion/reveal";
import { SceneFrame } from "@/components/entrance/scene-frame";
import { BarButton } from "@/components/ui/bar-button";
import { EASE_DRIFT } from "@/lib/entrance/motion-presets";
import type { NightAlleyOutcome } from "@/lib/entrance/night-outcome";
import { MEMORIES_EXIT_FADE_SEC, MEMORIES_RETURN_FADE_OUT_SEC } from "@/lib/entrance/start-entry-timing";
import { motion } from "motion/react";

type NightAlleyScreenProps = {
  outcome: NightAlleyOutcome;
  onDismiss: () => void;
  onOpenDiary?: (diaryId: string) => void;
  /** 記録を開く — ホーム「メモを見る」と同じ暗転 */
  diaryFadeOut?: boolean;
  onDiaryFadeOutComplete?: () => void;
  /** また今度読む — ホーム定常へ暗転 */
  homeFadeOut?: boolean;
  onHomeFadeOutComplete?: () => void;
};

const outcomeTextClass =
  "font-serif-jp text-[15px] font-normal leading-[2] tracking-[0.12em] text-stone-200/85";

/** 夜を終えた後の帰り道 — 入口の雨路地とは別背景・より静か */
export function NightAlleyScreen({
  outcome,
  onDismiss,
  onOpenDiary,
  diaryFadeOut = false,
  onDiaryFadeOutComplete,
  homeFadeOut = false,
  onHomeFadeOutComplete,
}: NightAlleyScreenProps) {
  return (
    <SceneFrame>
      <AfterNightBackdrop />

      <div className="absolute inset-0 z-30 flex flex-col items-center justify-end px-8 pb-[22%] pt-16">
        <div className="w-full max-w-xs space-y-9 text-center">
          {outcome.kind === "composing" && (
            <Reveal delay={0.6} duration={1.6}>
              <p className={outcomeTextClass}>
                今夜の記録を綴っています…
              </p>
            </Reveal>
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
                <p className={outcomeTextClass}>……今夜はうまく預かれなかった。</p>
              </Reveal>
              <Reveal delay={1.8}>
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
