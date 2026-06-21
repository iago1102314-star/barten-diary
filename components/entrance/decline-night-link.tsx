"use client";

import {
  ornamentalDiamondPath,
  MOOD_ORNAMENTAL_DIVIDER_TUNING,
} from "@/lib/entrance/mood-ornamental-divider-tuning";
import {
  declineLinkTextStyle,
  DECLINE_NIGHT_LINK_TUNING,
} from "@/lib/entrance/decline-night-link-tuning";
import { moodSelectUiAnimScaledSec } from "@/lib/entrance/mood-select-entrance-tuning";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

type DeclineNightLinkProps = {
  onDecline: () => void;
  disabled?: boolean;
  /** 気分選択画面 — 上の装飾ラインを表示 */
  showDivider?: boolean;
  /**
   * 指定するとこの秒数後に入場アニメーションを開始する。
   * 未指定の場合は即時表示（入場演出なし）。
   */
  entranceDelaySec?: number;
};

/** 夜が始まる前だけ — 路地へ戻る逃げ道 */
export function DeclineNightLink({
  onDecline,
  disabled = false,
  showDivider = false,
  entranceDelaySec,
}: DeclineNightLinkProps) {
  const { text, back, opacity, hoverOpacity, hover, tap, divider, entrance } =
    DECLINE_NIGHT_LINK_TUNING;
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [entranceDone, setEntranceDone] = useState(entranceDelaySec === undefined);
  const textStyle = declineLinkTextStyle(text);

  const isEntranceMode = entranceDelaySec !== undefined;
  const playEntrance = isEntranceMode && !entranceDone;
  const interactive = entranceDone && !disabled;

  const contentOpacity = isPressed ? tap.opacity : isHovered ? hoverOpacity : opacity;
  const backOpacity = isPressed ? tap.opacity : isHovered ? back.hoverOpacity : back.opacity;
  const contentColor = isPressed ? tap.color : text.color;
  const cssTransition = `opacity ${hover.durationSec}s ease, color ${hover.durationSec}s ease`;

  const t = (sec: number) => moodSelectUiAnimScaledSec(sec);
  const base = entranceDelaySec ?? 0;

  const starDelay = base + t(entrance.star.delayAfterStartSec);
  const starDuration = t(entrance.star.durationSec);
  const lineDelay = base + t(entrance.star.delayAfterStartSec + entrance.line.delayAfterStarSec);
  const lineDuration = t(entrance.line.durationSec);
  const textDelay = base + t(entrance.star.delayAfterStartSec + entrance.text.delayAfterStarSec);
  const textDuration = t(entrance.text.durationSec);
  const totalSec = base + t(entrance.totalAfterStartSec);

  useEffect(() => {
    if (!isEntranceMode) {
      setEntranceDone(true);
      return;
    }
    setEntranceDone(false);
    const timer = window.setTimeout(() => setEntranceDone(true), totalSec * 1000);
    return () => window.clearTimeout(timer);
  }, [isEntranceMode, totalSec]);

  const { viewBoxWidth, viewBoxHeight, centerY, moodFooter } =
    MOOD_ORNAMENTAL_DIVIDER_TUNING;
  const { line, diamond } = moodFooter;

  const starTransition = playEntrance
    ? { delay: starDelay, duration: starDuration, ease: entrance.star.ease }
    : { duration: 0 };
  const lineTransition = playEntrance
    ? { delay: lineDelay, duration: lineDuration, ease: entrance.line.ease }
    : { duration: 0 };
  const textTransition = playEntrance
    ? { delay: textDelay, duration: textDuration, ease: entrance.text.ease }
    : { duration: 0 };

  return (
    <div
      className={`${showDivider ? "mx-auto w-[90%]" : ""}`}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
    >
      {showDivider && (
        <svg
          width="100%"
          height={viewBoxHeight}
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            color: contentColor,
            display: "block",
            marginBottom: divider.marginBottomPx,
            transform: `translate(${divider.offsetXpx}px, ${divider.offsetYpx}px)`,
            opacity: playEntrance ? opacity : contentOpacity,
            transition: playEntrance ? undefined : cssTransition,
          }}
          aria-hidden
        >
          {playEntrance ? (
            <>
              <motion.g
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: opacity, scaleX: 1 }}
                transition={lineTransition}
                style={{
                  transformOrigin: `${line.leftLineEndX}px ${centerY}px`,
                  transformBox: "fill-box",
                }}
              >
                <line
                  x1={line.leftLineStartX}
                  y1={centerY}
                  x2={line.leftLineEndX}
                  y2={centerY}
                  stroke="currentColor"
                  strokeWidth={line.strokeWidth}
                  strokeLinecap="round"
                />
              </motion.g>
              <motion.g
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: opacity, scaleX: 1 }}
                transition={lineTransition}
                style={{
                  transformOrigin: `${line.rightLineStartX}px ${centerY}px`,
                  transformBox: "fill-box",
                }}
              >
                <line
                  x1={line.rightLineStartX}
                  y1={centerY}
                  x2={line.rightLineEndX}
                  y2={centerY}
                  stroke="currentColor"
                  strokeWidth={line.strokeWidth}
                  strokeLinecap="round"
                />
              </motion.g>
            </>
          ) : (
            <>
              <line
                x1={line.leftLineStartX}
                y1={centerY}
                x2={line.leftLineEndX}
                y2={centerY}
                stroke="currentColor"
                strokeWidth={line.strokeWidth}
                strokeLinecap="round"
                opacity={contentOpacity}
              />
              <line
                x1={line.rightLineStartX}
                y1={centerY}
                x2={line.rightLineEndX}
                y2={centerY}
                stroke="currentColor"
                strokeWidth={line.strokeWidth}
                strokeLinecap="round"
                opacity={contentOpacity}
              />
            </>
          )}
          <motion.g
            initial={
              playEntrance
                ? { opacity: 0, scale: entrance.star.initialScale }
                : false
            }
            animate={{ opacity: opacity, scale: 1 }}
            transition={starTransition}
            style={{ transformOrigin: `${diamond.centerX}px ${centerY}px` }}
          >
            <path
              d={ornamentalDiamondPath(
                diamond.centerX,
                centerY,
                diamond.halfWidth,
                diamond.halfHeight,
              )}
              fill="currentColor"
            />
          </motion.g>
        </svg>
      )}

      <motion.div
        className={interactive ? "" : "pointer-events-none"}
        initial={playEntrance ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={textTransition}
      >
        <button
          type="button"
          onClick={onDecline}
          disabled={disabled}
          onPointerDown={() => interactive && setIsPressed(true)}
          onPointerUp={() => setIsPressed(false)}
          onPointerLeave={() => setIsPressed(false)}
          onPointerCancel={() => setIsPressed(false)}
          className="mx-auto flex items-center justify-center py-2 font-serif-jp disabled:cursor-not-allowed disabled:opacity-40"
          style={{ gap: back.gapPx }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={back.sizePx}
            height={back.sizePx}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
            style={{
              color: contentColor,
              opacity: backOpacity,
              transform: `translate(${back.offsetXpx}px, ${back.offsetYpx}px)`,
              transition: cssTransition,
            }}
            aria-hidden
          >
            <path d="M6 8L2 12L6 16" />
            <path d="M2 12H22" />
          </svg>
          <span
            style={{
              ...textStyle,
              color: contentColor,
              opacity: playEntrance ? 1 : contentOpacity,
              transition: cssTransition,
            }}
          >
            また今度にする
          </span>
        </button>
      </motion.div>
    </div>
  );
}
