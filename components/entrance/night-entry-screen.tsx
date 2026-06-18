"use client";

import { Haze } from "@/components/entrance/atmosphere";
import { GlowAnchorMarker } from "@/components/entrance/glow-anchor-marker";
import { SceneFrame } from "@/components/entrance/scene-frame";
import { BarButton } from "@/components/ui/bar-button";
import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import { resolveLampGlowRgb } from "@/lib/entrance/lamp-glow-color";
import {
  getLampBreatheClassName,
  getLampBreatheStyleFromProfile,
} from "@/lib/entrance/lamp-glow-breathe";
import {
  interpolateStartGlowVisual,
  pairStartGlowsById,
} from "@/lib/entrance/lamp-glow-interpolate";
import { lampGlowCenteredLayoutStyle } from "@/lib/entrance/lamp-glow-position";
import {
  buildBokehGlowBackground,
  bokehOrbElementOpacity,
  buildLampGlowBackground,
  lampGlowElementOpacity,
} from "@/lib/entrance/lamp-glow-visual";
import { EASE_DRIFT } from "@/lib/entrance/motion-presets";
import { getStartLampBreatheProfile } from "@/lib/entrance/start-lamp-glow-breathe";
import {
  DOOR_EXIT_DURATION_SEC,
  DOOR_EXIT_IMAGE_ZOOM_SCALE,
  DOOR_EXIT_ORIGIN,
  DOOR_EXIT_ORIGIN_X_PERCENT,
  DOOR_EXIT_ORIGIN_Y_PERCENT,
  DOOR_EXIT_ZOOM_SCALE,
  SHOW_DOOR_EXIT_ORIGIN_MARKER,
  MEMORIES_EXIT_FADE_SEC,
  START_ENTRY_BOKEH_HOLD_MS,
  START_ENTRY_BUTTONS_DELAY_MS,
  START_ENTRY_REVEAL_MS,
  START_ENTRY_TITLE_DELAY_MS,
  STEADY_HOME_FADE_IN_SEC,
} from "@/lib/entrance/start-entry-timing";
import {
  SHOW_START_BOKEH_ONLY_POSITION_MARKERS,
  START_BOKEH_BACKGROUND_OPACITY,
  START_BOKEH_LAMP_GLOWS,
  START_BOKEH_ONLY_LAMP_GLOWS,
  type StartBokehLampGlowConfig,
} from "@/lib/entrance/start-bokeh-lamp-glows";
import {
  SHOW_START_LAMP_GLOW_DEBUG_MARKERS,
  SHOW_START_LAMP_GLOW_LIGHT,
  START_LAMP_GLOWS,
  type StartLampGlowConfig,
} from "@/lib/entrance/start-lamp-glows";
import { motion } from "motion/react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

// ─── 開発用フラグ ──────────────────────────────────────────────────────────────
/** true にするとボケ入場画面で止まる（デザイン確認用） */
const BOKEH_ENTRANCE_FREEZE = false;

// ─── タイミング定数 ────────────────────────────────────────────────────────────
const BOKEH_HOLD_MS = START_ENTRY_BOKEH_HOLD_MS;
const REVEAL_MS = START_ENTRY_REVEAL_MS;
const TITLE_DELAY_MS = START_ENTRY_TITLE_DELAY_MS;
const BUTTONS_DELAY_MS = START_ENTRY_BUTTONS_DELAY_MS;

// ─── Ken Burns ────────────────────────────────────────────────────────────────
const ALLEY_KEN_BURNS = {
  initial: { scale: 1.12, x: -10 },
  animate: { scale: 1, x: 0 },
  transition: {
    scale: { duration: 16, ease: "easeOut" as const },
    x: { duration: 16, ease: "easeOut" as const },
  },
} as const;

export type EntryScreenPhase = "bokeh" | "revealing" | "normal";

function BokehOnlyOrb({
  glow,
  fade = 1,
}: {
  glow: StartBokehLampGlowConfig;
  fade?: number;
}) {
  const rgb = resolveLampGlowRgb(glow.tone, glow.colorRgb);
  const clampedFade = Math.max(0, Math.min(1, fade));
  const intensity = Math.min(3, glow.intensity * clampedFade);
  return (
    <div
      className="pointer-events-none absolute rounded-full"
      style={{
        ...lampGlowCenteredLayoutStyle(
          glow.offsetX,
          glow.offsetY,
          glow.size,
          glow.ratio,
        ),
        background: buildBokehGlowBackground(rgb, intensity),
        opacity: bokehOrbElementOpacity(intensity) * clampedFade,
        mixBlendMode: "screen",
        filter: "blur(2px)",
      }}
      aria-hidden
    />
  );
}

/** ペア7灯 — ボケ→定常を progress (0〜1) で連続補間。背景 Ken Burns と同じ座標系 */
function PairedStartEntranceGlow({
  bokeh,
  steady,
  progress,
  enableBreathe = false,
}: {
  bokeh: StartBokehLampGlowConfig;
  steady: StartLampGlowConfig;
  progress: number;
  enableBreathe?: boolean;
}) {
  const visual = interpolateStartGlowVisual(bokeh, steady, progress);
  const intensity = Math.min(3, visual.intensity);
  const layoutStyle = lampGlowCenteredLayoutStyle(
    visual.offsetX,
    visual.offsetY,
    visual.size,
    visual.ratio,
  );
  const blurFilter =
    visual.blurPx > 0 ? `blur(${visual.blurPx}px)` : undefined;
  const breatheProfile = enableBreathe
    ? getStartLampBreatheProfile(steady.anchor)
    : undefined;

  if (breatheProfile) {
    return (
      <div
        className={`pointer-events-none absolute rounded-full ${getLampBreatheClassName(breatheProfile.variant)}`}
        style={{
          ...layoutStyle,
          background: buildLampGlowBackground(visual.rgb, intensity),
          mixBlendMode: "screen",
          filter: blurFilter,
          ...getLampBreatheStyleFromProfile(breatheProfile, intensity),
        }}
        aria-hidden
      />
    );
  }

  const bokehWeight = 1 - visual.steadyWeight;
  const lampWeight = visual.steadyWeight;

  return (
    <div
      className="pointer-events-none absolute rounded-full"
      style={{
        ...layoutStyle,
        filter: blurFilter,
      }}
      aria-hidden
    >
      {bokehWeight > 0.001 && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: buildBokehGlowBackground(visual.rgb, intensity),
            opacity: bokehWeight * bokehOrbElementOpacity(intensity),
            mixBlendMode: "screen",
          }}
        />
      )}
      {lampWeight > 0.001 && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: buildLampGlowBackground(visual.rgb, intensity),
            opacity: lampWeight * lampGlowElementOpacity(intensity),
            mixBlendMode: "screen",
          }}
        />
      )}
    </div>
  );
}

type NightEntryScreenProps = {
  onEnterCounter: () => void;
  onOpenMemories: () => void;
  skipImageEntrance?: boolean;
  /** メモから戻る — 定常ホームをフェードイン */
  steadyFadeIn?: boolean;
  onSteadyFadeInComplete?: () => void;
  /** 扉を開ける — 75% 50% へズーム + フェードアウト */
  doorExiting?: boolean;
  onDoorExitComplete?: () => void;
  /** メモへ — 暗転 */
  memoriesFadeOut?: boolean;
  onMemoriesFadeOutComplete?: () => void;
  /** 定常状態の光（編集時は draft） */
  steadyLampGlows?: StartLampGlowConfig[];
  /** 読み込み直後ボケ玉（編集時は draft） */
  bokehLampGlows?: StartBokehLampGlowConfig[];
  /** ボケ専用光 — 移行完了で消える（編集時は draft） */
  bokehOnlyLampGlows?: StartBokehLampGlowConfig[];
  /** 調整UI — rain-alley 背景 opacity を手動上書き（0〜1） */
  devBackgroundOpacity?: number;
  onPhaseChange?: (phase: EntryScreenPhase) => void;
  freezeKenBurns?: boolean;
};

export function NightEntryScreen({
  onEnterCounter,
  onOpenMemories,
  skipImageEntrance = false,
  steadyFadeIn = false,
  onSteadyFadeInComplete,
  doorExiting = false,
  onDoorExitComplete,
  memoriesFadeOut = false,
  onMemoriesFadeOutComplete,
  steadyLampGlows = START_LAMP_GLOWS,
  bokehLampGlows = START_BOKEH_LAMP_GLOWS,
  bokehOnlyLampGlows = START_BOKEH_ONLY_LAMP_GLOWS,
  devBackgroundOpacity,
  onPhaseChange,
  freezeKenBurns = false,
}: NightEntryScreenProps) {
  const showMarkers = SHOW_START_LAMP_GLOW_DEBUG_MARKERS;
  const showBokehOnlyMarkers = SHOW_START_BOKEH_ONLY_POSITION_MARKERS;
  const showGlow = SHOW_START_LAMP_GLOW_LIGHT || showMarkers;
  const interactionLocked = doorExiting || memoriesFadeOut;

  const [phase, setPhase] = useState<EntryScreenPhase>(
    skipImageEntrance ? "normal" : "bokeh",
  );
  const [revealProgress, setRevealProgress] = useState(
    skipImageEntrance ? 1 : 0,
  );

  const glowPairs = useMemo(
    () => pairStartGlowsById(bokehLampGlows, steadyLampGlows),
    [bokehLampGlows, steadyLampGlows],
  );

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  const backgroundOpacity =
    devBackgroundOpacity ??
    (phase === "normal"
      ? 1
      : phase === "revealing"
        ? START_BOKEH_BACKGROUND_OPACITY +
          (1 - START_BOKEH_BACKGROUND_OPACITY) * revealProgress
        : START_BOKEH_BACKGROUND_OPACITY);

  useEffect(() => {
    if (skipImageEntrance || BOKEH_ENTRANCE_FREEZE || freezeKenBurns) return;

    const t1 = setTimeout(() => setPhase("revealing"), BOKEH_HOLD_MS);
    const t2 = setTimeout(() => setPhase("normal"), BOKEH_HOLD_MS + REVEAL_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [skipImageEntrance, freezeKenBurns]);

  useEffect(() => {
    if (phase === "bokeh") {
      setRevealProgress(0);
      return;
    }
    if (phase === "normal") {
      setRevealProgress(1);
      return;
    }

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / REVEAL_MS);
      setRevealProgress(t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const isNormal = phase === "normal";
  const revealDuration = REVEAL_MS / 1000;
  const entranceProgress = skipImageEntrance
    ? 1
    : phase === "bokeh"
      ? 0
      : phase === "revealing"
        ? revealProgress
        : 1;
  const bokehOnlyFade = Math.max(0, 1 - entranceProgress);
  const showAnchoredGlows = showGlow && SHOW_START_LAMP_GLOW_LIGHT;
  const isSteadyReturn = steadyFadeIn && skipImageEntrance;
  const showUi = isNormal && !interactionLocked;

  const titleTransition = isSteadyReturn
    ? { duration: STEADY_HOME_FADE_IN_SEC, delay: 0, ease: EASE_DRIFT }
    : {
        duration: interactionLocked ? 0.35 : 1.2,
        delay: showUi ? TITLE_DELAY_MS / 1000 : 0,
      };

  const buttonsTransition = isSteadyReturn
    ? { duration: STEADY_HOME_FADE_IN_SEC, delay: 0, ease: EASE_DRIFT }
    : {
        duration: interactionLocked ? 0.35 : 1.4,
        delay: showUi ? BUTTONS_DELAY_MS / 1000 : 0,
      };

  const kenBurnsMotion =
    doorExiting || freezeKenBurns
      ? { initial: false as const, animate: { scale: 1, x: 0 } }
      : ALLEY_KEN_BURNS;

  const handleSceneAnimationComplete = () => {
    if (doorExiting) {
      onDoorExitComplete?.();
    }
  };

  const handleSteadyFadeInComplete = () => {
    if (isSteadyReturn) {
      onSteadyFadeInComplete?.();
    }
  };

  return (
    <SceneFrame>
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={
          doorExiting
            ? { scale: DOOR_EXIT_ZOOM_SCALE, opacity: 0 }
            : { scale: 1, opacity: 1 }
        }
        style={{ transformOrigin: DOOR_EXIT_ORIGIN }}
        transition={{
          duration: doorExiting ? DOOR_EXIT_DURATION_SEC : 0,
          ease: EASE_DRIFT,
        }}
        onAnimationComplete={handleSceneAnimationComplete}
      >
        <motion.div
          className="absolute inset-0"
          initial={isSteadyReturn ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={
            isSteadyReturn
              ? { duration: STEADY_HOME_FADE_IN_SEC, ease: EASE_DRIFT }
              : { duration: 0 }
          }
        >
        <motion.div className="absolute inset-0" {...kenBurnsMotion}>
          <motion.div
            className="absolute inset-0"
            initial={
              skipImageEntrance ? false : { opacity: START_BOKEH_BACKGROUND_OPACITY }
            }
            animate={{ opacity: backgroundOpacity }}
            transition={
              devBackgroundOpacity != null ||
              skipImageEntrance ||
              phase === "revealing" ||
              doorExiting
                ? { duration: 0 }
                : { duration: revealDuration, ease: "easeOut" }
            }
          >
            <motion.div
              className="absolute inset-0"
              animate={{
                scale: doorExiting ? DOOR_EXIT_IMAGE_ZOOM_SCALE : 1,
              }}
              transition={{
                duration: doorExiting ? DOOR_EXIT_DURATION_SEC : 0,
                ease: EASE_DRIFT,
              }}
              style={{ transformOrigin: DOOR_EXIT_ORIGIN }}
            >
              <Image
                src={ENTRANCE_ASSETS.start}
                alt=""
                fill
                priority
                sizes="440px"
                className="object-cover"
                style={{
                  objectPosition: doorExiting ? DOOR_EXIT_ORIGIN : "60% 50%",
                }}
                draggable={false}
                unoptimized
              />
            </motion.div>
          </motion.div>

          {(showAnchoredGlows || showBokehOnlyMarkers) && (
            <div className="pointer-events-none absolute inset-0 z-[1]">
              {showMarkers &&
                entranceProgress >= 1 &&
                steadyLampGlows.map((glow) => (
                  <GlowAnchorMarker key={`marker-${glow.id}`} glow={glow} />
                ))}
              {showBokehOnlyMarkers &&
                bokehOnlyLampGlows.map((glow) => (
                  <GlowAnchorMarker
                    key={`marker-${glow.id}`}
                    glow={glow}
                    compact
                  />
                ))}
              {showAnchoredGlows &&
                glowPairs.map(({ bokeh, steady }) => (
                  <PairedStartEntranceGlow
                    key={`paired-${bokeh.id}`}
                    bokeh={bokeh}
                    steady={steady}
                    progress={entranceProgress}
                    enableBreathe={entranceProgress >= 1}
                  />
                ))}
              {showAnchoredGlows &&
                !skipImageEntrance &&
                entranceProgress < 1 &&
                bokehOnlyLampGlows.map((glow) => (
                  <BokehOnlyOrb
                    key={`bokeh-only-${glow.id}`}
                    glow={glow}
                    fade={bokehOnlyFade}
                  />
                ))}
            </div>
          )}
        </motion.div>

        <Haze y={36} intensity={1} />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/40 via-transparent to-stone-950/80" />
        <div className="absolute inset-0 bg-[#0a1020]/20 mix-blend-multiply" />
        </motion.div>

        <motion.button
          type="button"
          aria-label="バーの入口"
          onClick={interactionLocked ? undefined : onEnterCounter}
          animate={{ opacity: doorExiting ? 0 : 1 }}
          transition={{ duration: doorExiting ? 0.35 : 0 }}
          className={`absolute right-[10%] top-[36%] z-20 h-[26%] w-[34%] [-webkit-tap-highlight-color:transparent] ${
            interactionLocked ? "pointer-events-none" : ""
          }`}
        />

        <div className="absolute inset-0 z-30 flex flex-col items-center justify-between px-7 py-[14%]">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{
              opacity: showUi ? 1 : 0,
              y: showUi ? 0 : -8,
            }}
            transition={titleTransition}
            className="space-y-3 text-center"
          >
            <p className="text-[10px] tracking-[0.5em] text-stone-400/65 uppercase">
              back bar
            </p>
            <h1 className="font-serif-jp text-[22px] font-normal tracking-[0.22em] text-stone-100/90">
              バーテン日記
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showUi ? 1 : 0 }}
            transition={buttonsTransition}
            className={`w-full max-w-[260px] space-y-4 text-center ${
              interactionLocked ? "pointer-events-none" : ""
            }`}
          >
            <BarButton
              variant="primary"
              transparent
              hoverDurationMs={350}
              onClick={interactionLocked ? undefined : onEnterCounter}
            >
              扉を開ける
            </BarButton>
            <BarButton
              variant="ghost"
              onClick={interactionLocked ? undefined : onOpenMemories}
            >
              メモを見る
            </BarButton>
          </motion.div>
        </div>
      </motion.div>

      {isSteadyReturn && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-[55] bg-black"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: STEADY_HOME_FADE_IN_SEC, ease: EASE_DRIFT }}
          onAnimationComplete={handleSteadyFadeInComplete}
        />
      )}

      {memoriesFadeOut && (
        <motion.div
          className="absolute inset-0 z-[60] bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: MEMORIES_EXIT_FADE_SEC, ease: EASE_DRIFT }}
          onAnimationComplete={onMemoriesFadeOutComplete}
        />
      )}

      {SHOW_DOOR_EXIT_ORIGIN_MARKER && (
        <>
          <div
            className="pointer-events-none absolute z-[45] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow-[0_0_0_2px_#fff,0_0_10px_3px_rgba(255,0,0,0.9)]"
            style={{
              left: `${DOOR_EXIT_ORIGIN_X_PERCENT}%`,
              top: `${DOOR_EXIT_ORIGIN_Y_PERCENT}%`,
            }}
            aria-hidden
          />
          <span
            className="pointer-events-none absolute z-[45] whitespace-nowrap font-mono text-[10px] font-bold leading-tight text-red-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
            style={{
              left: `${DOOR_EXIT_ORIGIN_X_PERCENT}%`,
              top: `${DOOR_EXIT_ORIGIN_Y_PERCENT}%`,
              transform: "translate(-50%, calc(-50% + 14px))",
            }}
          >
            扉ズーム ({DOOR_EXIT_ORIGIN_X_PERCENT}%, {DOOR_EXIT_ORIGIN_Y_PERCENT}%)
          </span>
        </>
      )}
    </SceneFrame>
  );
}
