"use client";

import { Typewriter } from "@/components/motion/typewriter";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

const STATUS_LINES = [
  "……言葉を、静かに整えている。",
  "……今夜の温度を、確かめている。",
  "……瓶のラベルを、選んでいる。",
  "……記録の形に、近づいている。",
] as const;

/** GeneratingScene 相当 — 封をする儀式の短縮版 */
export function GeneratingPanel() {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setLineIndex((i) => (i + 1) % STATUS_LINES.length);
    }, 1400);
    return () => clearInterval(timer);
  }, []);

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
        className="font-serif-jp text-[14px] tracking-[0.1em] text-stone-300/85"
      >
        <Typewriter text={STATUS_LINES[lineIndex]} speed={45} />
      </motion.p>
    </div>
  );
}
