"use client";

import { MoodOrnamentalDivider } from "@/components/entrance/mood-ornamental-divider";
import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import {
  MOOD_SELECT_ENTRANCE_DURATION_SCALE,
  moodSelectUiAnimScaledSec,
} from "@/lib/entrance/mood-select-entrance-tuning";
import { moodLinkTextStyle } from "@/lib/entrance/past-bottle-link-tuning";
import { resolvePastBottleLinkTuning } from "@/lib/entrance/compact-height-viewport";
import { useCompactHeightViewport } from "@/hooks/use-compact-height-viewport";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type PastBottleLinkProps = {
  onClick: () => void;
  disabled?: boolean;
  /** 遷移後も同位置に固定（操作不可・通常見た目を維持） */
  locked?: boolean;
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
  locked = false,
  skipEntrance = false,
  entranceDelaySec = 0,
}: PastBottleLinkProps) {
  const compactHeight = useCompactHeightViewport();
  const tuning = resolvePastBottleLinkTuning(compactHeight);
  const { text, icon, hover, tap, hit, divider, entrance, navigate } = tuning;
  const playEntrance = !skipEntrance || MOOD_SELECT_ENTRANCE_DURATION_SCALE > 1;
  const [isHovered, setIsHovered] = useState(false);
  const [tapTick, setTapTick] = useState(0);
  const [entranceDone, setEntranceDone] = useState(!playEntrance);
  const navigatingRef = useRef(false);
  const navigateTimerRef = useRef<number | null>(null);
  const t = (sec: number) => moodSelectUiAnimScaledSec(sec);
  const active =
    navigatingRef.current || (isHovered && !locked && !disabled);
  const interactive = entranceDone && !locked && !disabled;
  const hoverTransition = {
    duration: hover.durationMs / 1000,
    ease: hover.ease,
  };
  const iconDisplayPx = icon.sizePx * icon.displayScale;
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
  const hitWidthPx =
    iconDisplayPx + icon.gapPx + hit.paddingXpx * 2;
  const hitHeightPadPx = hit.paddingYpx * 2;

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

  useEffect(() => {
    if (locked) {
      setIsHovered(false);
    }
  }, [locked]);

  useEffect(
    () => () => {
      if (navigateTimerRef.current !== null) {
        window.clearTimeout(navigateTimerRef.current);
      }
    },
    [],
  );

  const handleActivate = () => {
    if (!interactive || navigatingRef.current) return;

    setIsHovered(true);
    setTapTick((tick) => tick + 1);
    navigatingRef.current = true;

    navigateTimerRef.current = window.setTimeout(() => {
      navigateTimerRef.current = null;
      navigatingRef.current = false;
      onClick();
    }, navigate.delaySec * 1000);
  };

  return (
    <div
      className={`mx-auto w-fit ${
        disabled
          ? "cursor-not-allowed opacity-40"
          : locked
            ? "pointer-events-none"
            : interactive
              ? ""
              : "pointer-events-none"
      }`}
      style={{
        transform: `translate(${text.offsetXpx}px, ${text.offsetYpx}px)`,
      }}
    >
      <motion.div
        animate={{ scale: active ? hover.scale : 1 }}
        transition={hoverTransition}
        onMouseLeave={() => {
          if (!locked && !navigatingRef.current) setIsHovered(false);
        }}
        className="flex items-center py-2 font-serif-jp"
        style={{ gap: icon.gapPx }}
      >
        <span
          className="pointer-events-none relative shrink-0"
          style={{
            width: iconDisplayPx,
            height: iconDisplayPx,
            transform: `translate(${icon.offsetXpx}px, ${icon.offsetYpx}px)`,
            zIndex: 1,
          }}
          aria-hidden
        >
          <motion.span
            className="absolute inset-0 block"
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
        </span>

        <span
          className="flex min-w-0 flex-col items-stretch"
          style={{ zIndex: 0 }}
        >
          <div className="relative">
            {interactive ? (
              <button
                type="button"
                aria-label="過去のボトルから"
                onClick={handleActivate}
                onMouseEnter={() => setIsHovered(true)}
                onFocus={() => setIsHovered(true)}
                onBlur={() => setIsHovered(false)}
                onPointerDown={() => setIsHovered(true)}
                className="absolute z-10 border-0 bg-transparent p-0 select-none outline-none [-webkit-tap-highlight-color:transparent]"
                style={{
                  left: -(iconDisplayPx + icon.gapPx + hit.paddingXpx),
                  top: -hit.paddingYpx,
                  width: `calc(100% + ${hitWidthPx}px)`,
                  height: `calc(100% + ${hitHeightPadPx}px)`,
                  cursor: "pointer",
                }}
              />
            ) : null}

            <motion.span
              className="pointer-events-none mx-0 block select-none whitespace-nowrap"
              style={{
                ...moodLinkTextStyle(text),
                padding: `${hit.paddingYpx}px 0`,
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
            >
              過去のボトルから
            </motion.span>
          </div>

          <div
            className="pointer-events-none"
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
