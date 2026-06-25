"use client";

import { BarButton } from "@/components/ui/bar-button";
import { Typewriter } from "@/components/motion/typewriter";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

const STATUS_LINES = [
  "……言葉を、静かに整えている。",
  "……今夜の温度を、確かめている。",
  "……瓶のラベルを、選んでいる。",
  "……記録の形に、近づいている。",
] as const;

type GeneratingPanelProps = {
  failed?: boolean;
  onRetry?: () => void;
};

/** GeneratingScene 相当 — 封をする儀式の短縮版 */
export function GeneratingPanel({
  failed = false,
  onRetry,
}: GeneratingPanelProps) {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (failed) return;
    const timer = setInterval(() => {
      setLineIndex((i) => (i + 1) % STATUS_LINES.length);
    }, 1400);
    return () => clearInterval(timer);
  }, [failed]);

  if (failed) {
    return (
      <div className="space-y-6 text-center">
        <p className="font-serif-jp text-[14px] leading-relaxed text-stone-300/85">
          ……うまく紡げなかった。
          <br />
          もう一度だけ試してくれ。
        </p>
        {onRetry && (
          <BarButton variant="ghost" onClick={onRetry}>
            もう一度紡ぐ
          </BarButton>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <motion.div
        className="mx-auto h-16 w-16 rounded-full border border-amber-200/20"
        animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.4, 0.85, 0.4] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.p
        key={lineIndex}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="font-serif-jp text-[14px] text-stone-300/85"
      >
        <Typewriter text={STATUS_LINES[lineIndex]} speed={45} />
      </motion.p>
    </div>
  );
}
