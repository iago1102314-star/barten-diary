"use client";

import {
  ornamentalDiamondPath,
  MOOD_ORNAMENTAL_DIVIDER_TUNING,
} from "@/lib/entrance/mood-ornamental-divider-tuning";
import {
  declineLinkTextStyle,
  DECLINE_NIGHT_LINK_TUNING,
} from "@/lib/entrance/decline-night-link-tuning";
import {
  DECLINE_ENTRANCE_BASE_SEC,
  MOOD_SELECT_ENTRANCE_DURATION_SCALE,
} from "@/lib/entrance/mood-select-entrance-tuning";
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
  const { text, back, opacity, hoverOpacity, hover, tap, divider } =
    DECLINE_NIGHT_LINK_TUNING;
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [entranceDone, setEntranceDone] = useState(entranceDelaySec === undefined);
  const textStyle = declineLinkTextStyle(text);

  const isEntranceMode = entranceDelaySec !== undefined;
  const interactive = entranceDone && !disabled;

  const contentOpacity = isPressed ? tap.opacity : isHovered ? hoverOpacity : opacity;
  const backOpacity = isPressed ? tap.opacity : isHovered ? back.hoverOpacity : back.opacity;
  const contentColor = isPressed ? tap.color : text.color;
  const cssTransition = `opacity ${hover.durationSec}s ease, color ${hover.durationSec}s ease`;

  // ── 入場アニメーション タイミング（scale 適用後の実効秒）────────────────────
  const scale = MOOD_SELECT_ENTRANCE_DURATION_SCALE;
  const t = (base: number) => base * scale;
  const base = entranceDelaySec ?? 0;

  // 星: まず出現
  const starDelay = base;
  const starDuration = t(0.15);
  // 線: 星が出始めてから少し後
  const lineDelay = base + t(0.10);
  const lineDuration = t(0.50);
  // テキスト（ボタン）: 線が伸び始める頃にフェードイン
  const textDelay = base + t(0.18);
  const textDuration = t(0.45);
  // 合計 ≒ DECLINE_ENTRANCE_BASE_SEC × scale
  const totalSec = base + DECLINE_ENTRANCE_BASE_SEC * scale;

  useEffect(() => {
    if (!isEntranceMode) {
      setEntranceDone(true);
      return;
    }
    setEntranceDone(false);
    const timer = window.setTimeout(() => setEntranceDone(true), totalSec * 1000);
    return () => window.clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEntranceMode, totalSec]);

  // ── SVG 定数 ─────────────────────────────────────────────────────────────────
  const { viewBoxWidth, viewBoxHeight, centerY, moodFooter } =
    MOOD_ORNAMENTAL_DIVIDER_TUNING;
  const { line, diamond } = moodFooter;
  // 左右とも同じ長さ（viewBox 座標系）
  const lineLen = line.leftLineEndX - line.leftLineStartX; // = 67

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
            ...(entranceDone
              ? { opacity: contentOpacity, transition: cssTransition }
              : {}),
          }}
          aria-hidden
        >
          {isEntranceMode && !entranceDone ? (
            <>
              {/* 左ライン — ダイヤ側(x=98) から外側(x=31) へ伸びる */}
              <motion.path
                d={`M ${line.leftLineEndX} ${centerY} L ${line.leftLineStartX} ${centerY}`}
                stroke="currentColor"
                strokeWidth={line.strokeWidth}
                initial={{ pathLength: 0, opacity: opacity }}
                animate={{ pathLength: 1, opacity: opacity }}
                transition={{ delay: lineDelay, duration: lineDuration, ease: "easeOut" }}
              />
              {/* 右ライン — ダイヤ側(x=122) から外側(x=189) へ伸びる */}
              <motion.path
                d={`M ${line.rightLineStartX} ${centerY} L ${line.rightLineEndX} ${centerY}`}
                stroke="currentColor"
                strokeWidth={line.strokeWidth}
                initial={{ pathLength: 0, opacity: opacity }}
                animate={{ pathLength: 1, opacity: opacity }}
                transition={{ delay: lineDelay, duration: lineDuration, ease: "easeOut" }}
              />
              {/* 星（ダイヤ） — 最初に出現 */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: opacity }}
                transition={{ delay: starDelay, duration: starDuration, ease: "easeOut" }}
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
              />
              <line
                x1={line.rightLineStartX}
                y1={centerY}
                x2={line.rightLineEndX}
                y2={centerY}
                stroke="currentColor"
                strokeWidth={line.strokeWidth}
              />
              <path
                d={ornamentalDiamondPath(
                  diamond.centerX,
                  centerY,
                  diamond.halfWidth,
                  diamond.halfHeight,
                )}
                fill="currentColor"
              />
            </>
          )}
        </svg>
      )}

      {/* ボタン本体 — 入場中はフェードイン、完了後は CSS hover */}
      <motion.div
        className={interactive ? "" : "pointer-events-none"}
        initial={isEntranceMode ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={
          isEntranceMode && !entranceDone
            ? { delay: textDelay, duration: textDuration, ease: "easeOut" }
            : { duration: 0 }
        }
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
              opacity: contentOpacity,
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
