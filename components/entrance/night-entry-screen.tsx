"use client";

import { SceneFrame } from "@/components/entrance/scene-frame";
import { HomeEntryButton } from "@/components/entrance/home-entry-button";
import { HomeAuthButton } from "@/components/entrance/home-auth-button";
import { LoadingGateMessage } from "@/components/entrance/loading-gate-message";
import {
  StartEntryAlleyLayer,
  START_ENTRY_ALLEY_KEN_BURNS,
} from "@/components/entrance/start-entry-alley-layer";
import { BarButton } from "@/components/ui/bar-button";
import {
  HOME_AUTH_BUTTON_TUNING,
  HOME_ENTRY_BUTTON_TUNING,
  HOME_ENTRY_TITLE_TUNING,
  SHOW_HOME_DIARY_DESIGN_BUTTON,
} from "@/lib/entrance/home-entry-tuning";
import { SHOW_LOADING_GATE_MESSAGE_ON_HOME } from "@/lib/entrance/loading-gate-message-tuning";
import { EASE_DRIFT } from "@/lib/entrance/motion-presets";
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
  START_BOKEH_BACKGROUND_OPACITY,
  START_BOKEH_LAMP_GLOWS,
  START_BOKEH_ONLY_LAMP_GLOWS,
  type StartBokehLampGlowConfig,
} from "@/lib/entrance/start-bokeh-lamp-glows";
import {
  START_LAMP_GLOWS,
  type StartLampGlowConfig,
} from "@/lib/entrance/start-lamp-glows";
import { SHOW_LOADING_GATE_LIGHT_ORDER_MARKERS } from "@/lib/entrance/loading-gate-light-sequence";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

// ─── 開発用フラグ ──────────────────────────────────────────────────────────────
/** true にするとボケ入場画面で止まる（デザイン確認用） */
const BOKEH_ENTRANCE_FREEZE = false;

// ─── タイミング定数 ────────────────────────────────────────────────────────────
const BOKEH_HOLD_MS = START_ENTRY_BOKEH_HOLD_MS;
const REVEAL_MS = START_ENTRY_REVEAL_MS;
const TITLE_DELAY_MS = START_ENTRY_TITLE_DELAY_MS;
const BUTTONS_DELAY_MS = START_ENTRY_BUTTONS_DELAY_MS;

// ─── Ken Burns ────────────────────────────────────────────────────────────────
const ALLEY_KEN_BURNS = START_ENTRY_ALLEY_KEN_BURNS;

export type EntryScreenPhase = "bokeh" | "revealing" | "normal";

type NightEntryScreenProps = {
  onEnterCounter: () => void;
  onOpenMemories: () => void;
  /** 日記詳細デザインモック（本番以外） */
  onOpenDiaryPaperMock?: () => void;
  /** 背景タップ — 路地 BGM 開始（ボタン押下は対象外） */
  onBackgroundTap?: () => void;
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
  onOpenDiaryPaperMock,
  onBackgroundTap,
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
  const interactionLocked = doorExiting || memoriesFadeOut;

  const [phase, setPhase] = useState<EntryScreenPhase>(
    skipImageEntrance ? "normal" : "bokeh",
  );
  const [revealProgress, setRevealProgress] = useState(
    skipImageEntrance ? 1 : 0,
  );
  const handleBackgroundTap = (event: React.PointerEvent) => {
    if (interactionLocked) return;
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest("button, a, [role='button']")
    ) {
      return;
    }
    onBackgroundTap?.();
  };

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
  const entranceProgress = skipImageEntrance
    ? 1
    : phase === "bokeh"
      ? 0
      : phase === "revealing"
        ? revealProgress
        : 1;
  const bokehOnlyFade = Math.max(0, 1 - entranceProgress);
  const isSteadyReturn = steadyFadeIn && skipImageEntrance;
  const showUi = isNormal && !interactionLocked;

  const titleTransition = isSteadyReturn
    ? { duration: 0 }
    : {
        duration: interactionLocked ? 0.35 : 1.2,
        delay: showUi ? TITLE_DELAY_MS / 1000 : 0,
      };

  const buttonsTransition = isSteadyReturn
    ? { duration: 0 }
    : {
        duration: interactionLocked ? 0.35 : 1.4,
        delay: showUi ? BUTTONS_DELAY_MS / 1000 : 0,
      };

  const kenBurnsMotion =
    doorExiting || freezeKenBurns || skipImageEntrance || isSteadyReturn
      ? { initial: false as const, animate: { scale: 1, x: 0 } }
      : ALLEY_KEN_BURNS;

  const handleSceneAnimationComplete = () => {
    if (doorExiting) {
      onDoorExitComplete?.();
    }
  };

  const steadyFadeCompletedRef = useRef(false);

  const finishSteadyFadeIn = () => {
    if (steadyFadeCompletedRef.current) return;
    steadyFadeCompletedRef.current = true;
    onSteadyFadeInComplete?.();
  };

  const handleSteadyFadeInComplete = () => {
    if (isSteadyReturn) {
      finishSteadyFadeIn();
    }
  };

  useEffect(() => {
    if (!isSteadyReturn) {
      steadyFadeCompletedRef.current = false;
    }
  }, [isSteadyReturn]);

  return (
    <SceneFrame onPointerDown={handleBackgroundTap}>
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
          className="pointer-events-none absolute inset-0"
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0 }}
        >
          <StartEntryAlleyLayer
            backgroundOpacity={backgroundOpacity}
            entranceProgress={entranceProgress}
            bokehOnlyFade={bokehOnlyFade}
            steadyLampGlows={steadyLampGlows}
            bokehLampGlows={bokehLampGlows}
            bokehOnlyLampGlows={bokehOnlyLampGlows}
            kenBurnsMotion={kenBurnsMotion}
            showBokehOnlyOrbs={!skipImageEntrance}
            imageScale={doorExiting ? DOOR_EXIT_IMAGE_ZOOM_SCALE : 1}
            imageObjectPosition={doorExiting ? DOOR_EXIT_ORIGIN : "60% 50%"}
            imageTransformOrigin={DOOR_EXIT_ORIGIN}
            imageScaleTransition={{
              duration: doorExiting ? DOOR_EXIT_DURATION_SEC : 0,
              ease: EASE_DRIFT,
            }}
            showOrderMarkers={SHOW_LOADING_GATE_LIGHT_ORDER_MARKERS}
          />
        </motion.div>

        <motion.button
          type="button"
          aria-label="バーの入口"
          onClick={interactionLocked ? undefined : onEnterCounter}
          animate={{ opacity: doorExiting ? 0 : 1 }}
          transition={{ duration: doorExiting ? 0.35 : 0 }}
          className={`absolute right-[10%] top-[36%] z-20 h-[26%] w-[34%] touch-manipulation [-webkit-tap-highlight-color:transparent] ${
            interactionLocked || !showUi ? "pointer-events-none" : "pointer-events-auto"
          }`}
        />

        <motion.div
          initial={isSteadyReturn ? false : { opacity: 0, y: -8 }}
          animate={{
            opacity: showUi ? 1 : 0,
            y: showUi ? 0 : isSteadyReturn ? 0 : -8,
          }}
          transition={titleTransition}
          className={`absolute z-30 ${
            !showUi || interactionLocked ? "pointer-events-none" : "pointer-events-auto"
          }`}
          style={{
            top: `${HOME_AUTH_BUTTON_TUNING.topPercent}%`,
            right: `${HOME_AUTH_BUTTON_TUNING.rightRem}rem`,
          }}
        >
          <HomeAuthButton disabled={interactionLocked} />
        </motion.div>

        <motion.div
          initial={isSteadyReturn ? false : { opacity: 0, y: -8 }}
          animate={{
            opacity: showUi ? 1 : 0,
            y: showUi ? 0 : isSteadyReturn ? 0 : -8,
          }}
          transition={titleTransition}
          className="pointer-events-none absolute inset-x-0 z-30 px-7"
          style={{ top: `${HOME_ENTRY_TITLE_TUNING.topPercent}%` }}
        >
          <h1
            className="font-app-title ml-auto flex w-fit flex-col items-end text-right font-normal leading-none text-stone-100/90"
            style={{
              transform: `translateX(${HOME_ENTRY_TITLE_TUNING.translateXRem}rem)`,
              fontSize: HOME_ENTRY_TITLE_TUNING.fontSizePx,
              letterSpacing: `${HOME_ENTRY_TITLE_TUNING.letterSpacingEm}em`,
            }}
          >
            <span>バーテン</span>
            <span
              className="inline-block border-current"
              style={{
                marginTop: HOME_ENTRY_TITLE_TUNING.lineGapPx,
                borderBottomWidth: HOME_ENTRY_TITLE_TUNING.underlineHeightPx,
                borderBottomStyle: "solid",
                paddingBottom: HOME_ENTRY_TITLE_TUNING.underlineGapPx,
              }}
            >
              日記
            </span>
          </h1>
        </motion.div>

        <motion.div
          initial={isSteadyReturn ? false : { opacity: 0 }}
          animate={{ opacity: showUi ? 1 : 0 }}
          transition={buttonsTransition}
          className={`absolute inset-x-0 z-40 flex justify-center px-7 ${
            !showUi || interactionLocked ? "pointer-events-none" : "pointer-events-auto"
          }`}
          style={{ bottom: `${HOME_ENTRY_BUTTON_TUNING.bottomPercent}%` }}
        >
          <div
            className="w-full text-center"
            style={{
              maxWidth: HOME_ENTRY_BUTTON_TUNING.maxWidthPx,
              display: "flex",
              flexDirection: "column",
              gap: `${HOME_ENTRY_BUTTON_TUNING.stackGapRem}rem`,
            }}
          >
            <HomeEntryButton
              onClick={interactionLocked ? undefined : onEnterCounter}
              disabled={interactionLocked}
            >
              カウンターへ
            </HomeEntryButton>
            <HomeEntryButton
              onClick={interactionLocked ? undefined : onOpenMemories}
              disabled={interactionLocked}
            >
              記録を開く
            </HomeEntryButton>
            {SHOW_HOME_DIARY_DESIGN_BUTTON && onOpenDiaryPaperMock && (
              <BarButton
                variant="quiet"
                onClick={interactionLocked ? undefined : onOpenDiaryPaperMock}
              >
                日記デザイン（仮）
              </BarButton>
            )}
          </div>
        </motion.div>
      </motion.div>

      {SHOW_LOADING_GATE_MESSAGE_ON_HOME && <LoadingGateMessage />}

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
