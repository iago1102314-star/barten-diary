"use client";

import { NightEntryScreen } from "@/components/entrance/night-entry-screen";
import { EASE_DRIFT } from "@/lib/entrance/motion-presets";
import { motion } from "motion/react";

type EntryFadeOutScreenProps = {
  onFadeComplete: () => void;
};

/** 路地画面の上に黒が被さり、完全に暗転する */
export function EntryFadeOutScreen({ onFadeComplete }: EntryFadeOutScreenProps) {
  return (
    <div className="stage-viewport relative">
      <NightEntryScreen
        skipImageEntrance
        onEnterCounter={() => {}}
        onOpenMemories={() => {}}
      />
      <motion.div
        className="absolute inset-0 z-50 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: EASE_DRIFT }}
        onAnimationComplete={onFadeComplete}
      />
    </div>
  );
}
