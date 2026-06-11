"use client";

import { EASE_SOFT } from "@/lib/entrance/motion-presets";
import { motion } from "motion/react";
import Image from "next/image";

type DrinkOnCounterProps = {
  src: string;
  drinkName?: string;
  drinkNote?: string | null;
  visible?: boolean;
};

/** TalkScene 相当 — カウンター上にグラスを置く */
export function DrinkOnCounter({
  src,
  drinkName,
  drinkNote,
  visible = true,
}: DrinkOnCounterProps) {
  if (!visible) return null;

  return (
    <>
      <motion.div
        className="pointer-events-none absolute left-[27%] top-[50%] z-[4] -translate-x-1/2"
        initial={{ opacity: 0, y: -8, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1, duration: 1.2, ease: EASE_SOFT }}
      >
        <div className="relative h-28 w-20">
          <div
            className="absolute -inset-4 rounded-full blur-xl"
            style={{
              background:
                "radial-gradient(circle, rgba(222,168,96,0.35), transparent 70%)",
            }}
          />
          <div className="relative h-full w-full overflow-hidden">
            <Image
              src={src}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
              style={{
                objectPosition: "86% 80%",
                transform: "scale(1.55)",
                transformOrigin: "86% 82%",
              }}
              draggable={false}
              unoptimized
            />
          </div>
          <motion.div
            className="absolute left-2 top-3 h-8 w-px bg-white/25"
            animate={{ opacity: [0.2, 0.55, 0.2] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {(drinkName || drinkNote) && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-[38%] z-[4] flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
        >
          <div className="rounded-full border border-white/8 bg-black/35 px-4 py-1.5 backdrop-blur-sm">
            {drinkName && (
              <p className="text-center text-[10px] tracking-[0.2em] text-stone-300/85">
                {drinkName}
              </p>
            )}
            {drinkNote && (
              <p className="mt-0.5 text-center text-[9px] tracking-wide text-stone-500/80">
                {drinkNote}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
}
