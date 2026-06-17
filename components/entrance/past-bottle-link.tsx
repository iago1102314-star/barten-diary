"use client";

import { MoodOrnamentalDivider } from "@/components/entrance/mood-ornamental-divider";
import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import { moodLinkTextStyle, PAST_BOTTLE_LINK_TUNING } from "@/lib/entrance/past-bottle-link-tuning";
import { motion } from "motion/react";
import { useState } from "react";

type PastBottleLinkProps = {
  onClick: () => void;
  disabled?: boolean;
};

/** 気分選択 — 過去のボトルへ（上部配置用） */
export function PastBottleLink({ onClick, disabled = false }: PastBottleLinkProps) {
  const { text, icon, hover, divider } = PAST_BOTTLE_LINK_TUNING;
  const [iconHovered, setIconHovered] = useState(false);
  const crossfadeSec = icon.crossfadeMs / 1000;

  return (
    <div
      className="mx-auto w-fit"
      style={{
        transform: `translate(${text.offsetXpx}px, ${text.offsetYpx}px)`,
      }}
    >
      <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled}
        whileHover={disabled ? undefined : { scale: hover.scale }}
        whileTap={{ scale: disabled ? 1 : 0.97 }}
        transition={{ duration: 0.075, ease: "easeOut" }}
        onMouseEnter={() => !disabled && setIconHovered(true)}
        onMouseLeave={() => setIconHovered(false)}
        onFocus={() => !disabled && setIconHovered(true)}
        onBlur={() => setIconHovered(false)}
        className="flex items-center py-2 font-serif-jp disabled:cursor-not-allowed disabled:opacity-40"
        style={{ gap: icon.gapPx }}
      >
        <span
          className="relative shrink-0"
          style={{
            width: icon.sizePx,
            height: icon.sizePx,
            transform: `translate(${icon.offsetXpx}px, ${icon.offsetYpx}px)`,
          }}
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={ENTRANCE_ASSETS.past}
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
            draggable={false}
            animate={{ opacity: iconHovered ? 0 : 1 }}
            transition={{ duration: crossfadeSec, ease: "easeInOut" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={ENTRANCE_ASSETS.pastHover}
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
            draggable={false}
            animate={{ opacity: iconHovered ? 1 : 0 }}
            transition={{ duration: crossfadeSec, ease: "easeInOut" }}
          />
        </span>
        <span className="flex min-w-0 flex-col items-stretch">
          <span
            className="whitespace-nowrap"
            style={moodLinkTextStyle(text)}
          >
            過去のボトルから
          </span>
          <MoodOrnamentalDivider
            variant="pastBottle"
            color={text.color}
            style={{ marginTop: divider.marginTopPx }}
          />
        </span>
      </motion.button>
    </div>
  );
}
