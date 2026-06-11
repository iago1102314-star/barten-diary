"use client";

import { Haze, LampGlow } from "@/components/entrance/atmosphere";
import { SceneFrame } from "@/components/entrance/scene-frame";
import { BarButton } from "@/components/ui/bar-button";
import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import { motion } from "motion/react";
import Image from "next/image";

type NightEntryScreenProps = {
  onEnterCounter: () => void;
  onOpenMemories: () => void;
  /** 路地画像の入場フェードを省略（暗転オーバーレイ用） */
  skipImageEntrance?: boolean;
};

const IMAGE_ENTRANCE = {
  durationSec: 3,
  initialOpacity: 0.1,
  initialBlurPx: 16,
} as const;

/** AlleyScene 相当 — 雨の路地入口 */
export function NightEntryScreen({
  onEnterCounter,
  onOpenMemories,
  skipImageEntrance = false,
}: NightEntryScreenProps) {
  return (
    <SceneFrame>
      {/* Ken Burns — 画像のみ 0.1→1.0 + ぼかし解除（3秒） */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.12, x: -10 }}
        animate={{ scale: 1, x: 0 }}
        transition={{
          scale: { duration: 16, ease: "easeOut" },
          x: { duration: 16, ease: "easeOut" },
        }}
      >
        <motion.div
          className="absolute inset-0"
          initial={
            skipImageEntrance
              ? false
              : {
                  opacity: IMAGE_ENTRANCE.initialOpacity,
                  filter: `blur(${IMAGE_ENTRANCE.initialBlurPx}px)`,
                }
          }
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={
            skipImageEntrance
              ? { duration: 0 }
              : { duration: IMAGE_ENTRANCE.durationSec }
          }
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
      </motion.div>

      {/* 実光源 — 最初から表示 */}
      <LampGlow x={20} y={12} tone="cold" size={16} intensity={1.2} speed="7s" />
      <LampGlow x={31} y={39} tone="neon" size={10} intensity={2.2} speed="5s" />
      <LampGlow x={55} y={37} tone="warm" size={26} intensity={0.48} speed="5.5s" />
      <LampGlow x={68} y={37} tone="warm" size={24} intensity={0.44} speed="6.8s" />
      <Haze y={36} intensity={1} />

      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/40 via-transparent to-stone-950/80" />
      <div className="absolute inset-0 bg-[#0a1020]/20 mix-blend-multiply" />

      {/* 入口タップ誘導 — 右側の扉エリア */}
      <motion.button
        type="button"
        aria-label="バーの入口"
        onClick={onEnterCounter}
        whileTap={{ scale: 0.97 }}
        className="absolute right-[10%] top-[36%] z-20 h-[26%] w-[34%] [-webkit-tap-highlight-color:transparent]"
      >
        <motion.span
          className="absolute inset-0 rounded-full bg-amber-200/25 blur-2xl"
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.button>

      <div className="absolute inset-0 z-30 flex flex-col items-center justify-between px-7 py-[14%]">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1.2 }}
          className="space-y-3 text-center"
        >
          <p className="text-[10px] tracking-[0.5em] text-stone-400/65 uppercase">
            back bar
          </p>
          <h1 className="font-serif-jp text-[22px] font-normal tracking-[0.22em] text-stone-100/90">
            バーテン日記
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1.4 }}
          className="w-full max-w-[260px] space-y-4 text-center"
        >
          <BarButton variant="primary" transparent onClick={onEnterCounter}>
            扉を開ける
          </BarButton>
          <BarButton variant="ghost" onClick={onOpenMemories}>
            夜のメモを開く
          </BarButton>
        </motion.div>
      </div>
    </SceneFrame>
  );
}
