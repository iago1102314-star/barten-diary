"use client";

import { motion } from "motion/react";
import { barAudioEngine } from "@/lib/entrance/bar-audio-engine";
import { PAST_BOTTLE_LINK_TUNING } from "@/lib/entrance/past-bottle-link-tuning";
import {
  hexToRgba,
  MOOD_VIGNETTE_TUNING,
} from "@/lib/entrance/mood-vignette-tuning";
import { MOOD_SELECT_LAYOUT_TUNING } from "@/lib/entrance/mood-select-layout-tuning";
import { useEffect, useState, type ReactNode } from "react";

export type MoodOption = {
  id: string;
  label: string;
  sub: string;
  color: string;
  glow: string;
  resultLabel?: string;
  resultSub?: string;
  resultDrinkId?: string;
};

export type BarSeatMoodPickerProps = {
  options: MoodOption[];
  promptText?: string;
  onSelect: (option: MoodOption) => void;
  /** 選択確定前（幕を上げる等）。第2引数で注ぎ演出を開始 */
  onBeforeSelect?: (option: MoodOption, proceed: () => void) => void;
  showPourAnimation?: boolean;
  pourCompleteDelay?: number;
  className?: string;
  /** true のときデフォルト暗グラデを敷かない（カウンター背景を見せる） */
  transparentBackground?: boolean;
  /** true のとき入場フェード・選択肢遅延を省略 */
  instantEntrance?: boolean;
  /** 選択確定時 — 注ぎ演出に使う杯を決める（省略時は option の表示のまま） */
  resolveOption?: (option: MoodOption) => MoodOption;
  /** 入場演出の時間倍率（2 = 0.5倍速） */
  entranceDurationScale?: number;
  children?: ReactNode;
  /** 画面上部 — 幕より上 */
  header?: ReactNode;
  footer?: ReactNode;
};

const TIMING = {
  sceneFadeIn: 1,
  promptTypeSpeed: 80,
  optionBaseDelay: 1.2,
  optionStagger: 0.18,
  /** ボタン間の登場間隔の倍率 */
  optionStaggerFactor: 0.5,
  optionSlideDuration: 0.7,
  /** スライド到着時間の倍率 */
  optionSlideDurationFactor: 0.6,
  /** 出現時の横スライド距離（px） */
  optionSlideOffsetPx: 160,
  /** 選択肢ホバー in/out（秒） */
  optionHoverDurationSec: 0.075,
  /** 選択肢ボタンの横幅倍率 */
  optionButtonWidthScale: 0.9,
  /** 右端アクセント — 下端で左端からこの割合まで（0.5 = 50%） */
  optionAccentBottomReachRatio: 0.28,
  /** 右端アクセント — 左境界の斜線角度（度・水平から） */
  optionAccentDiagonalAngleDeg: 35,
  /** 右端アクセント — 斜線計算用のボタン概算アスペクト（幅/高） */
  optionAccentAspectWOverH: 7,
  /** 枠線まわり inset グローの α */
  optionBorderGlowAlpha: 0.3,
  /** 左の玉 — 直径（px） */
  optionDotSizePx: 10,
  /** ボタン上下 padding（px・旧 14 + 4） */
  optionButtonPaddingYpx: 20,
  pourStartDelay: 700,
  pourCompleteDelay: 3400,
} as const;

const MOOD_OPTION_TEXT = {
  title: "#ece4d2",
  /** タイトルに対する明るさ 45% */
  sub: "rgba(236, 228, 210, 0.45)",
  subFontSizePx: 11,
} as const;

/** ぼかし演出 — false で無効（コードは残す） */
const MOOD_OPTION_BLUR = {
  enabled: true,
  buttonBackdropClass: "backdrop-blur-[2px]",
  leftGlowBlurClass: "blur-xl",
  insetShadowBlurPx: 24,
  hoverInsetShadowBlurPx: 32,
} as const;

const MOOD_OPTION_ACCENT = {
  /** 斜め色領域の overlay opacity（0.9 から 20% 下げ） */
  overlayOpacity: 0.7,
  /** glow rgba の α に掛ける倍率（20% 透明化） */
  glowAlphaScale: 0.8,
} as const;

function scaleGlowAlpha(glow: string, scale: number): string {
  return glow.replace(/([\d.]+)\)$/, (_, alpha) => {
    const next = Math.min(1, parseFloat(alpha) * scale);
    return `${next})`;
  });
}

function moodOptionButtonBlurClass() {
  return MOOD_OPTION_BLUR.enabled ? MOOD_OPTION_BLUR.buttonBackdropClass : "";
}

function moodOptionLeftGlowBlurClass() {
  return MOOD_OPTION_BLUR.enabled ? MOOD_OPTION_BLUR.leftGlowBlurClass : "";
}

function moodOptionInsetShadowBlurPx() {
  return MOOD_OPTION_BLUR.enabled ? MOOD_OPTION_BLUR.insetShadowBlurPx : 0;
}

function moodOptionHoverInsetShadowBlurPx() {
  return MOOD_OPTION_BLUR.enabled ? MOOD_OPTION_BLUR.hoverInsetShadowBlurPx : 0;
}

/** 5ゾーンビネット — 背景と UI の間に挟まる影レイヤー */
function VignetteOverlay() {
  const { top, bottom, bottomLayers, layerZIndex } = MOOD_VIGNETTE_TUNING;
  const topTotalPx = top.fixedPx + top.gradPx;
  const topSolid = hexToRgba(top.color, top.opacity);
  const bottomSolid = hexToRgba(bottom.color, bottom.opacity);

  const topBg = `linear-gradient(to bottom, ${topSolid} 0px, ${topSolid} ${top.fixedPx}px, transparent 100%)`;
  const bottomBg = `linear-gradient(to top, ${bottomSolid} 0px, ${bottomSolid} ${bottom.fixedPx}px, transparent 100%)`;

  return (
    <>
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          zIndex: layerZIndex,
          height: topTotalPx,
          background: topBg,
        }}
        initial={{ opacity: 0, y: top.enterY }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: top.delaySec,
          duration: top.durationSec,
          ease: "easeOut",
        }}
      />
      {bottomLayers.map((layer, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{
            zIndex: layerZIndex,
            height: `${bottom.fixedPx + bottom.gradPx * layer.gradScale}px`,
            background: bottomBg,
          }}
          initial={{ opacity: 0, y: layer.enterY }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: layer.delaySec,
            duration: layer.durationSec,
            ease: "easeOut",
          }}
        />
      ))}
    </>
  );
}

function MoodPickerStyles() {
  return (
    <style>{`
      @keyframes bsm-bubble-up {
        0% { transform: translateY(0); opacity: 0; }
        20% { opacity: 0.7; }
        100% { transform: translateY(-34px); opacity: 0; }
      }
      @keyframes bsm-steam-rise {
        0% { transform: translateY(0) scale(1); opacity: 0; }
        30% { opacity: 0.5; }
        100% { transform: translateY(-26px) scale(1.6); opacity: 0; }
      }
      .bsm-bubble { animation: bsm-bubble-up 2.6s ease-in infinite; }
      .bsm-steam { animation: bsm-steam-rise 3s ease-out infinite; }
      .bsm-font-gothic {
        font-family: "Zen Kaku Gothic New", "Hiragino Kaku Gothic ProN", sans-serif;
      }
      @media (hover: hover) and (pointer: fine) {
        .mood-option-btn:not(:disabled):hover .mood-option-btn__glow {
          opacity: 1;
        }
        .mood-option-btn:not(:disabled):hover .mood-option-btn__accent {
          opacity: 1;
          filter: brightness(1.2);
        }
        .mood-option-btn:not(:disabled):hover .mood-option-btn__dot {
          transform: scale(1.15);
        }
      }
    `}</style>
  );
}

function Typewriter({
  text,
  speed = 70,
  className = "",
  onDone,
}: {
  text: string;
  speed?: number;
  className?: string;
  onDone?: () => void;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!text.length) {
      setCount(0);
      return;
    }

    setCount(0);
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) {
        clearInterval(timer);
        onDone?.();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  if (!text.length) return null;

  return (
    <span className={className}>
      {text.split("").map((ch, i) => (
        <span
          key={i}
          className="transition-opacity duration-500"
          style={{ opacity: i < count ? 1 : 0 }}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}

function Glass({ color, level }: { color: string; level: number }) {
  const h = 40;
  const liquid = Math.max(0, Math.min(1, level)) * (h - 8);

  return (
    <div className="relative" style={{ width: 34, height: h + 8 }}>
      <motion.div
        className="absolute bottom-[6px] left-[3px] right-[3px] rounded-b-[6px]"
        animate={{ height: liquid }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        style={{
          background: `linear-gradient(to bottom, ${color}f0, ${color}90)`,
          boxShadow: `0 0 14px ${color}66`,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="bsm-bubble absolute bottom-1 h-[3px] w-[3px] rounded-full bg-white/50"
            style={{ left: `${22 + i * 26}%`, animationDelay: `${i * 0.9}s` }}
          />
        ))}
      </motion.div>
      <div
        className="absolute inset-x-0 top-0 rounded-b-[8px] border border-white/25 bg-white/[0.04]"
        style={{ height: h }}
      />
      <div className="absolute left-[5px] top-[4px] h-[60%] w-[2px] rounded-full bg-white/30" />
      <div className="absolute -bottom-0 left-1/2 h-[5px] w-[120%] -translate-x-1/2 rounded-[50%] bg-black/60 blur-[2px]" />
      {level > 0.05 && (
        <>
          <span className="bsm-steam absolute -top-3 left-[30%] h-3 w-[2px] rounded-full bg-white/25 blur-[1px]" />
          <span
            className="bsm-steam absolute -top-3 left-[60%] h-3 w-[2px] rounded-full bg-white/20 blur-[1px]"
            style={{ animationDelay: "1.4s" }}
          />
        </>
      )}
    </div>
  );
}

export type MoodOptionButtonProps = {
  option: MoodOption;
  index: number;
  onClick: (option: MoodOption) => void;
  disabled?: boolean;
  entranceBaseDelay?: number;
  optionStagger?: number;
  slideDuration?: number;
  exiting?: boolean;
  totalOptions?: number;
};

/** 右端台形アクセント — 上辺が最短、下辺が最長（50%まで） */
function moodOptionAccentStyles(glow: string) {
  const bottomLeft = (1 - TIMING.optionAccentBottomReachRatio) * 100;
  const angleRad = (TIMING.optionAccentDiagonalAngleDeg * Math.PI) / 180;
  const deltaX =
    100 / Math.tan(angleRad) / TIMING.optionAccentAspectWOverH;
  const topLeft = Math.min(100, bottomLeft + deltaX);
  const accentGlow = scaleGlowAlpha(glow, MOOD_OPTION_ACCENT.glowAlphaScale);
  const transparentGlow = accentGlow.replace(/([\d.]+)\)$/, "0)");

  return {
    clipPath: `polygon(${topLeft}% 0, 100% 0, 100% 100%, ${bottomLeft}% 100%)`,
    background: `linear-gradient(to left, ${accentGlow} 0%, ${transparentGlow} 100%)`,
  };
}

export function MoodOptionButton({
  option,
  index,
  onClick,
  disabled = false,
  entranceBaseDelay = TIMING.optionBaseDelay,
  optionStagger = TIMING.optionStagger,
  slideDuration = TIMING.optionSlideDuration,
  exiting = false,
  totalOptions = 1,
}: MoodOptionButtonProps) {
  const entranceDelay = entranceBaseDelay + index * optionStagger;
  const exitDelay = (totalOptions - 1 - index) * optionStagger;
  const slideOffset =
    index % 2 === 0
      ? -TIMING.optionSlideOffsetPx
      : TIMING.optionSlideOffsetPx;
  const buttonWidth = `${TIMING.optionButtonWidthScale * 100}%`;
  const hoverTransition = {
    duration: TIMING.optionHoverDurationSec,
    ease: "easeOut" as const,
  };
  const insetGlow = option.glow
    .replace("0.35", String(TIMING.optionBorderGlowAlpha))
    .replace("0.4", String(TIMING.optionBorderGlowAlpha));
  const hoverInsetGlow = option.glow
    .replace("0.35", "0.14")
    .replace("0.4", "0.14");
  const accentStyles = moodOptionAccentStyles(option.glow);

  return (
    <motion.button
      type="button"
      onClick={() => onClick(option)}
      disabled={disabled}
      initial={{
        opacity: 0,
        x: slideOffset,
      }}
      animate={
        exiting
          ? { opacity: 0, x: slideOffset }
          : { opacity: 1, x: 0 }
      }
      transition={
        exiting
          ? {
              opacity: { delay: exitDelay, duration: slideDuration },
              x: { delay: exitDelay, duration: slideDuration },
              scale: hoverTransition,
              borderColor: hoverTransition,
              boxShadow: hoverTransition,
            }
          : {
              opacity: { delay: entranceDelay, duration: slideDuration },
              x: { delay: entranceDelay, duration: slideDuration },
              scale: hoverTransition,
              borderColor: hoverTransition,
              boxShadow: hoverTransition,
            }
      }
      whileHover={
        disabled
          ? undefined
          : {
              scale: 1.025,
              borderColor: `${option.color}aa`,
              boxShadow: `0 0 22px ${option.glow}, 0 0 6px ${option.color}55, inset 0 0 ${moodOptionHoverInsetShadowBlurPx()}px ${hoverInsetGlow}`,
            }
      }
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className={`mood-option-btn group relative mx-auto flex items-center gap-3 overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-r from-white/[0.04] to-transparent px-5 transition-[border-color,box-shadow] duration-75 disabled:pointer-events-none ${moodOptionButtonBlurClass()}`}
      style={{
        width: buttonWidth,
        paddingTop: TIMING.optionButtonPaddingYpx,
        paddingBottom: TIMING.optionButtonPaddingYpx,
        boxShadow: `inset 0 0 ${moodOptionInsetShadowBlurPx()}px ${insetGlow}`,
      }}
    >
      <span
        className={`mood-option-btn__glow absolute -left-4 top-1/2 h-14 w-14 -translate-y-1/2 rounded-full opacity-100 transition-opacity duration-75 ${moodOptionLeftGlowBlurClass()}`}
        style={{ background: option.glow }}
        aria-hidden
      />
      <span
        className="mood-option-btn__accent pointer-events-none absolute inset-0 rounded-xl transition-[opacity,filter] duration-75"
        style={{
          ...accentStyles,
          opacity: MOOD_OPTION_ACCENT.overlayOpacity,
        }}
        aria-hidden
      />
      <span
        className="mood-option-btn__dot relative z-[1] shrink-0 rounded-full transition-transform duration-75"
        style={{
          width: TIMING.optionDotSizePx,
          height: TIMING.optionDotSizePx,
          background: option.color,
          boxShadow: `0 0 8px ${option.color}`,
        }}
        aria-hidden
      />
      <span
        className="relative z-[1] font-serif-jp text-[17px] tracking-[0.25em]"
        style={{ color: MOOD_OPTION_TEXT.title }}
      >
        {option.label}
      </span>
      <span
        className="relative z-[1] ml-auto shrink-0 bsm-font-gothic tracking-[0.2em]"
        style={{
          color: MOOD_OPTION_TEXT.sub,
          fontSize: MOOD_OPTION_TEXT.subFontSizePx,
        }}
      >
        {option.sub}
      </span>
    </motion.button>
  );
}

export function BarSeatMoodPicker({
  options,
  promptText = "",
  onSelect,
  onBeforeSelect,
  showPourAnimation = true,
  pourCompleteDelay = TIMING.pourCompleteDelay,
  className = "",
  transparentBackground = false,
  instantEntrance = false,
  resolveOption,
  entranceDurationScale = 1,
  children,
  header,
  footer,
}: BarSeatMoodPickerProps) {
  const [picked, setPicked] = useState<MoodOption | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [poured, setPoured] = useState(false);

  const beginPour = (option: MoodOption) => {
    setPicked(option);

    if (!showPourAnimation) {
      onSelect(option);
      return;
    }

    setTimeout(() => setPoured(true), TIMING.pourStartDelay);
    setTimeout(() => onSelect(option), pourCompleteDelay);
  };

  const pick = (option: MoodOption) => {
    if (picked || isExiting) return;

    barAudioEngine.playClick();
    setIsExiting(true);

    const resolved = resolveOption?.(option) ?? option;

    if (onBeforeSelect) {
      onBeforeSelect(resolved, () => beginPour(resolved));
      return;
    }

    beginPour(resolved);
  };

  const background =
    children ??
    (transparentBackground ? null : (
      <div className="absolute inset-0 bg-gradient-to-b from-[#13100d] via-[#0d0b09] to-[#070605]" />
    ));

  const sceneFadeIn = instantEntrance ? 0 : TIMING.sceneFadeIn;
  const entranceScale = entranceDurationScale;
  const optionBaseDelay =
    (instantEntrance ? 0.06 : TIMING.optionBaseDelay) * entranceScale;
  const optionStagger =
    TIMING.optionStagger * entranceScale * TIMING.optionStaggerFactor;
  const slideDuration =
    TIMING.optionSlideDuration *
    entranceScale *
    TIMING.optionSlideDurationFactor;

  return (
    <>
      <MoodPickerStyles />
      <motion.div
        className={`absolute inset-0 ${className}`}
        initial={instantEntrance ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: sceneFadeIn }}
      >
        {background}

        {!picked && <VignetteOverlay />}

        {!picked ? (
          <div
            className="absolute inset-0"
            style={{ zIndex: MOOD_VIGNETTE_TUNING.uiLayerZIndex }}
          >
            {header && (
              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-20 px-7"
                style={{ paddingTop: `${PAST_BOTTLE_LINK_TUNING.headerTopPercent}%` }}
              >
                <div className="pointer-events-auto">{header}</div>
              </div>
            )}

            <div className="pointer-events-none absolute inset-0">
              {promptText && (
                <p className="pointer-events-auto mb-6 px-10 text-center font-serif-jp text-[14px] leading-loose tracking-[0.12em] text-[#e8dcc4]">
                  <Typewriter text={promptText} speed={TIMING.promptTypeSpeed} />
                </p>
              )}

              <div
                className="pointer-events-auto absolute inset-x-0 flex flex-col gap-3"
                style={{
                  bottom: MOOD_SELECT_LAYOUT_TUNING.optionBlockBottomPx,
                  paddingLeft: MOOD_SELECT_LAYOUT_TUNING.horizontalPaddingPx,
                  paddingRight: MOOD_SELECT_LAYOUT_TUNING.horizontalPaddingPx,
                }}
              >
                {options.map((option, i) => (
                  <MoodOptionButton
                    key={option.id}
                    option={option}
                    index={i}
                    onClick={pick}
                    disabled={isExiting}
                    exiting={isExiting}
                    totalOptions={options.length}
                    entranceBaseDelay={optionBaseDelay}
                    optionStagger={optionStagger}
                    slideDuration={slideDuration}
                  />
                ))}
              </div>

              {footer && (
                <div
                  className="pointer-events-auto absolute inset-x-0"
                  style={{
                    bottom: MOOD_SELECT_LAYOUT_TUNING.footerBottomPx,
                    paddingLeft: MOOD_SELECT_LAYOUT_TUNING.horizontalPaddingPx,
                    paddingRight: MOOD_SELECT_LAYOUT_TUNING.horizontalPaddingPx,
                  }}
                >
                  {footer}
                </div>
              )}
            </div>
          </div>
        ) : showPourAnimation ? (
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-[26%]">
            <motion.div
              className="absolute bottom-[37%] w-[3px] rounded-full"
              style={{
                background: `linear-gradient(to bottom, transparent, ${picked.color})`,
                boxShadow: `0 0 8px ${picked.color}`,
              }}
              initial={{ height: 0, opacity: 0 }}
              animate={
                poured
                  ? { height: [0, 90, 90, 0], opacity: [0, 1, 1, 0] }
                  : {}
              }
              transition={{ duration: 1.8, times: [0, 0.25, 0.75, 1] }}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Glass color={picked.color} level={poured ? 0.85 : 0} />
            </motion.div>

            <motion.div
              className="mt-9 text-center"
              initial={{ opacity: 0 }}
              animate={poured ? { opacity: 1 } : {}}
              transition={{ duration: 1, delay: 1.2 }}
            >
              <p className="font-serif-jp text-[15px] tracking-[0.3em] text-[#f4d9a6]">
                {picked.resultLabel ?? picked.label}
              </p>
              {picked.resultSub && (
                <p className="bsm-font-gothic mt-3 text-[11px] tracking-[0.2em] text-[#9aa0b5]">
                  {picked.resultSub}
                </p>
              )}
            </motion.div>
          </div>
        ) : null}
      </motion.div>
    </>
  );
}
