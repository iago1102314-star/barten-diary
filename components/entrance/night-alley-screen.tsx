"use client";

import { LampGlow } from "@/components/entrance/atmosphere";
import { Reveal } from "@/components/motion/reveal";
import { SceneFrame } from "@/components/entrance/scene-frame";
import { BarButton } from "@/components/ui/bar-button";
import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import { EASE_DRIFT } from "@/lib/entrance/motion-presets";
import type { NightAlleyOutcome } from "@/lib/entrance/night-outcome";
import { motion } from "motion/react";
import Image from "next/image";

type NightAlleyScreenProps = {
  outcome: NightAlleyOutcome;
  onDismiss: () => void;
};

const outcomeTextClass =
  "font-serif-jp text-[15px] font-normal leading-[2] tracking-[0.12em] text-stone-200/85";

/** 夜を終えた後の帰り道 — 入口の雨路地とは別背景・より静か */
export function NightAlleyScreen({ outcome, onDismiss }: NightAlleyScreenProps) {
  return (
    <SceneFrame>
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1.02 }}
        transition={{ opacity: { duration: 3 }, scale: { duration: 30, ease: EASE_DRIFT } }}
      >
        <Image
          src={ENTRANCE_ASSETS.afterNight}
          alt=""
          fill
          priority
          sizes="420px"
          className="object-cover"
          draggable={false}
          unoptimized
        />
      </motion.div>

      {/* 遠い街灯・わずかな窓明かり — ほぼ動かない静けさ（雨は使わない） */}
      <LampGlow x={58} y={29} tone="cold" size={11} intensity={0.26} speed="9s" />
      <LampGlow x={54} y={40} tone="cold" size={7} intensity={0.18} speed="12s" />
      <LampGlow x={11} y={18} tone="warm" size={8} intensity={0.2} speed="11s" />

      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

      <div className="absolute inset-0 z-30 flex flex-col items-center justify-end px-8 pb-[22%] pt-16">
        <div className="w-full max-w-xs space-y-9 text-center">
          {outcome.kind === "saved" && (
            <>
              <Reveal delay={0.7} duration={1.7}>
                <p className={outcomeTextClass}>今夜の記録を残しました。</p>
              </Reveal>
              <Reveal
                delay={1.8}
                duration={1.4}
                className="flex flex-col items-center gap-6"
              >
                <BarButton variant="ghost" href={`/diaries/${outcome.diaryId}`} onClick={onDismiss}>
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
                <p className={outcomeTextClass}>今夜の記録を残しました。</p>
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
    </SceneFrame>
  );
}
