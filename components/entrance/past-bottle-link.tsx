"use client";

import { MoodOrnamentalDivider } from "@/components/entrance/mood-ornamental-divider";
import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import { MOOD_SELECT_ENTRANCE_DURATION_SCALE } from "@/lib/entrance/mood-select-entrance-tuning";
import {
  moodLinkTextStyle,
  PAST_BOTTLE_LINK_TUNING,
} from "@/lib/entrance/past-bottle-link-tuning";
import { motion } from "motion/react";
import { useEffect, useState, type KeyboardEvent } from "react";

type PastBottleLinkProps = {
  onClick: () => void;
  disabled?: boolean;
  /** 過去ボトル画面から戻る等 — 出現演出を省略 */
  skipEntrance?: boolean;
  /**
   * 指定するとこの秒数後に封蝋が出現し始める（T=0 からのオフセット）。
   * 未指定の場合は即時スタート。
   */
  entranceDelaySec?: number;
};

/** 気分選択 — 過去のボトルから（上部配置用） */
export function PastBottleLink({
  onClick,
  disabled = false,
  skipEntrance = false,
  entranceDelaySec = 0,
}: PastBottleLinkProps) {
  const { text, icon, hover, tap, hit, divider, entrance } = PAST_BOTTLE_LINK_TUNING;
  const playEntrance = !skipEntrance || MOOD_SELECT_ENTRANCE_DURATION_SCALE > 1;
  const [isHovered, setIsHovered] = useState(false);
  const [tapTick, setTapTick] = useState(0);
  const [entranceDone, setEntranceDone] = useState(!playEntrance);
  const timeScale = MOOD_SELECT_ENTRANCE_DURATION_SCALE;
  const t = (sec: number) => sec * timeScale;
  const active = isHovered && !disabled;
  const interactive = entranceDone && !disabled;
  const hoverTransition = {
    duration: hover.durationMs / 1000,
    ease: hover.ease,
  };
  const iconDisplayPx = icon.sizePx * icon.displayScale;
  // 封蝋・装飾線・文字の各遅延に entranceDelaySec を加算
  const iconEntranceDelay = entranceDelaySec;
  const textEntranceDelay =
    entranceDelaySec + t(entrance.divider.delaySec) + t(entrance.text.delayAfterDividerSec);
  const dividerEntranceDelay = entranceDelaySec + t(entrance.divider.delaySec);
  const textEntranceTotalSec = t(
    entrance.text.durationSec + entrance.text.brightenDurationSec,
  );
  const textBrightenAt =
    t(entrance.text.durationSec) / textEntranceTotalSec;
  const textBrightenPeakAt =
    t(entrance.text.durationSec + entrance.text.brightenDurationSec * 0.45) /
    textEntranceTotalSec;

  useEffect(() => {
    if (!playEntrance) {
      setEntranceDone(true);
      return;
    }

    setEntranceDone(false);
    const totalMs = (textEntranceDelay + textEntranceTotalSec) * 1000;
    const timer = window.setTimeout(() => setEntranceDone(true), totalMs);
    return () => window.clearTimeout(timer);
  }, [playEntrance, textEntranceDelay, textEntranceTotalSec]);

  const handlePointerDown = () => {
    if (!interactive) return;
    setTapTick((tick) => tick + 1);
  };

  const handleActivate = () => {
    if (!interactive) return;
    onClick();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!interactive) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleActivate();
    }
  };

  const hitProps = interactive
    ? {
        onClick: handleActivate,
        onMouseEnter: () => setIsHovered(true),
      }
    : undefined;

  return (
    <div
      className={`mx-auto w-fit ${disabled ? "cursor-not-allowed opacity-40" : ""} ${interactive ? "" : "pointer-events-none"}`}
      style={{
        transform: `translate(${text.offsetXpx}px, ${text.offsetYpx}px)`,
      }}
    >
      <motion.div
        animate={{ scale: active ? hover.scale : 1 }}
        transition={hoverTransition}
        onMouseLeave={() => setIsHovered(false)}
        className="flex items-center py-2 font-serif-jp"
        style={{ gap: icon.gapPx }}
      >
        <span
          className="relative shrink-0"
          style={{
            width: iconDisplayPx,
            height: iconDisplayPx,
            transform: `translate(${icon.offsetXpx}px, ${icon.offsetYpx}px)`,
          }}
          aria-hidden
        >
          <motion.span
            className="pointer-events-none absolute inset-0 block"
            initial={
              playEntrance
                ? {
                    opacity: 0,
                    scale: entrance.icon.initialScale,
                    filter: `blur(${entrance.icon.initialBlurPx}px)`,
                  }
                : undefined
            }
            animate={{
              opacity: 1,
              scale: 1,
              filter: "blur(0px)",
            }}
            transition={
              playEntrance
                ? {
                    delay: iconEntranceDelay,
                    duration: t(entrance.icon.durationSec),
                    ease: entrance.icon.ease,
                  }
                : { duration: 0 }
            }
          >
            <motion.span
              key={tapTick}
              className="absolute inset-0 block"
              initial={false}
              animate={
                tapTick === 0
                  ? { scale: 1, filter: "brightness(1)" }
                  : {
                      scale: [1, tap.scaleMin, 1],
                      filter: [
                        "brightness(1)",
                        `brightness(${tap.brightnessMin})`,
                        "brightness(1)",
                      ],
                    }
              }
              transition={
                tapTick === 0
                  ? { duration: 0 }
                  : { duration: tap.durationSec, ease: tap.ease }
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <motion.img
                src={ENTRANCE_ASSETS.past}
                alt=""
                className="absolute inset-0 h-full w-full object-contain"
                draggable={false}
                style={{ filter: `brightness(${icon.pastBrightness})` }}
                initial={playEntrance ? { opacity: 0 } : false}
                animate={{ opacity: active ? 0 : 1 }}
                transition={hoverTransition}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <motion.img
                src={ENTRANCE_ASSETS.pastHover}
                alt=""
                className="absolute inset-0 h-full w-full object-contain"
                draggable={false}
                initial={playEntrance ? { opacity: 0 } : false}
                animate={{ opacity: active ? 1 : 0 }}
                transition={hoverTransition}
              />
            </motion.span>
          </motion.span>

          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            disabled={disabled}
            className="absolute border-0 bg-transparent p-0 select-none disabled:cursor-not-allowed"
            style={{
              width: hit.icon.widthPx,
              height: hit.icon.heightPx,
              left: hit.icon.offsetXpx,
              top: hit.icon.offsetYpx,
            }}
            {...hitProps}
            onPointerDown={handlePointerDown}
          />
        </span>

        <span className="flex min-w-0 flex-col items-stretch">
          <motion.button
            type="button"
            disabled={disabled}
            aria-label="過去のボトルから"
            onKeyDown={handleKeyDown}
            onFocus={() => interactive && setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
            className="mx-0 block border-0 bg-transparent p-0 font-serif-jp select-none whitespace-nowrap outline-none disabled:cursor-not-allowed disabled:opacity-40 [-webkit-tap-highlight-color:transparent]"
            style={{
              ...moodLinkTextStyle(text),
              padding: `${hit.text.paddingYpx}px 0`,
            }}
            initial={
              playEntrance
                ? {
                    opacity: 0,
                    x: text.labelOffsetXpx,
                    y: entrance.text.initialTranslateYPx,
                    filter: `blur(${entrance.text.initialBlurPx}px) brightness(1)`,
                  }
                : undefined
            }
            animate={
              playEntrance
                ? {
                    opacity: [0, 1, 1, 1],
                    x: text.labelOffsetXpx,
                    y: [entrance.text.initialTranslateYPx, 0, 0, 0],
                    filter: [
                      `blur(${entrance.text.initialBlurPx}px) brightness(1)`,
                      "blur(0px) brightness(1)",
                      `blur(0px) brightness(${entrance.text.brightenPeak})`,
                      "blur(0px) brightness(1)",
                    ],
                  }
                : {
                    opacity: 1,
                    x: text.labelOffsetXpx,
                    y: 0,
                    filter: "blur(0px) brightness(1)",
                  }
            }
            transition={
              playEntrance
                ? {
                    duration: textEntranceTotalSec,
                    delay: textEntranceDelay,
                    ease: entrance.text.ease,
                    times: [0, textBrightenAt, textBrightenPeakAt, 1],
                  }
                : { duration: 0 }
            }
            {...hitProps}
          >
            過去のボトルから
          </motion.button>
          <div
            style={{
              marginTop: divider.marginTopPx,
              transform: `translate(${divider.offsetXpx}px, ${divider.offsetYpx}px)`,
            }}
          >
            <motion.div
              className="origin-left"
              initial={
                playEntrance
                  ? {
                      scaleX: 0,
                      opacity: entrance.divider.initialOpacity,
                    }
                  : undefined
              }
              animate={{
                scaleX: 1,
                opacity: entrance.divider.finalOpacity,
              }}
              transition={
                playEntrance
                  ? {
                      delay: dividerEntranceDelay,
                      duration: t(entrance.divider.durationSec),
                      ease: entrance.divider.ease,
                    }
                  : { duration: 0 }
              }
            >
              <MoodOrnamentalDivider variant="pastBottle" color={text.color} />
            </motion.div>
          </div>
        </span>
      </motion.div>
    </div>
  );
}
