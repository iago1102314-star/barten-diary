"use client";

import { CounterScene } from "@/components/entrance/counter-scene";
import { DrinkNameReveal } from "@/components/entrance/drink-name-reveal";
import { DrinkRecordIntroPanel } from "@/components/entrance/drink-record-intro-panel";
import { RecordCounterScene } from "@/components/entrance/record-counter-scene";
import { DevPostRecordSkipButton } from "@/components/entrance/dev-post-record-skip-button";
import { EntranceTapSkipLayer } from "@/components/entrance/entrance-tap-skip-layer";
import { EnteringReveal } from "@/components/entrance/entering-reveal";
import { LeavingScreen } from "@/components/entrance/leaving-screen";
import { PostRecordExitBlack } from "@/components/entrance/post-record-exit-black";
import { PostRecordThanksScene } from "@/components/entrance/post-record-thanks-scene";
import { HomeLampGlowShapeEditor } from "@/components/entrance/home-lamp-glow-shape-editor";
import { StartLampGlowShapeEditor } from "@/components/entrance/start-lamp-glow-shape-editor";
import { StartBokehLampGlowShapeEditor } from "@/components/entrance/start-bokeh-lamp-glow-shape-editor";
import { StartBokehOnlyLampGlowPositionEditor } from "@/components/entrance/start-bokeh-only-lamp-glow-position-editor";
import { StartBokehOnlyLampGlowShapeEditor } from "@/components/entrance/start-bokeh-only-lamp-glow-shape-editor";
import { StartLampGlowPositionEditor } from "@/components/entrance/start-lamp-glow-position-editor";
import { MasterMoodPromptPanel } from "@/components/entrance/master-mood-prompt-panel";
import { MasterOnBlackScreen } from "@/components/entrance/master-on-black-screen";
import { MasterLine } from "@/components/entrance/master-line";
import { MemoriesScreen } from "@/components/entrance/memories-screen";
import { MoodSelectScene } from "@/components/entrance/mood-select-scene";
import { NightAlleyScreen } from "@/components/entrance/night-alley-screen";
import { NightEntryScreen, type EntryScreenPhase } from "@/components/entrance/night-entry-screen";
import { PastBottlePanel } from "@/components/entrance/past-bottle-panel";
import { PastBottleLink } from "@/components/entrance/past-bottle-link";
import { RecordingPanel } from "@/components/entrance/recording-panel";
import { SceneFrame } from "@/components/entrance/scene-frame";
import { prepareBarAudioOnUserGesture, syncBarAudioUnlockFromClient, useBarAudio } from "@/hooks/use-bar-audio";
import {
  BAR_AUDIO_LEVELS,
  BAR_AUDIO_TIMING,
} from "@/lib/entrance/audio-levels";
import type { CameraPose } from "@/lib/entrance/counter-camera-poses";
import {
  applyLampGlowShapePatch,
  mergeLampGlowsForShapeEdit,
  saveLampGlowOverrides,
} from "@/lib/entrance/lamp-glow-dev-overrides";
import {
  applyStartLampGlowShapePatch,
  mergeStartLampGlowsForShapeEdit,
  saveStartLampGlowOverrides,
} from "@/lib/entrance/start-lamp-glow-dev-overrides";
import {
  applyStartBokehOnlyLampGlowShapePatch,
  mergeStartBokehOnlyLampGlowsForShapeEdit,
  saveStartBokehOnlyLampGlowOverrides,
} from "@/lib/entrance/start-bokeh-only-lamp-glow-dev-overrides";
import {
  isStartBokehOnlyPositionEditing,
  isStartBokehOnlyShapeEditing,
  START_BOKEH_ONLY_LAMP_GLOWS,
  START_BOKEH_ONLY_POSITION_EDIT_ON_HOME,
  START_BOKEH_ONLY_SHAPE_EDIT_ON_HOME,
} from "@/lib/entrance/start-bokeh-lamp-glows";
import {
  applyStartBokehLampGlowShapePatch,
  mergeStartBokehLampGlowsForShapeEdit,
  saveStartBokehLampGlowOverrides,
} from "@/lib/entrance/start-bokeh-lamp-glow-dev-overrides";
import {
  isStartBokehLampGlowHomeEditing,
  START_BOKEH_BACKGROUND_OPACITY,
  START_BOKEH_LAMP_GLOW_SHAPE_EDIT_ON_HOME,
  type StartBokehLampGlowConfig,
  type StartBokehLampGlowShapeFields,
} from "@/lib/entrance/start-bokeh-lamp-glows";
import {
  isStartLampGlowHomeEditing,
  isStartLampGlowPositionEditing,
  START_LAMP_GLOW_SHAPE_EDIT_ON_HOME,
  START_LAMP_GLOWS,
  type StartLampGlowConfig,
} from "@/lib/entrance/start-lamp-glows";
import type { LampGlowShapeFields } from "@/lib/entrance/lamp-glow-types";
import {
  COUNTER_LAMP_GLOWS,
  isLampGlowHomeEditing,
  LAMP_GLOW_SHAPE_EDIT_ON_HOME,
  type CounterLampGlowConfig,
} from "@/lib/entrance/counter-lamp-glows";
import { useNightSession } from "@/hooks/use-night-session";
import type { LoadingGateSnapshot } from "@/lib/entrance/loading-gate-init";
import {
  markReturningVisitor,
} from "@/lib/entrance/visit-state";
import type { NightAlleyOutcome } from "@/lib/entrance/night-outcome";
import { getDrinkImagePath } from "@/lib/entrance/drink-image-path";
import { pickPastBottleMasterLine } from "@/lib/entrance/past-bottle-master-line";
import { MoodVignetteOverlay } from "@/components/entrance/mood-vignette-overlay";
import { PAST_BOTTLE_LINK_TUNING } from "@/lib/entrance/past-bottle-link-tuning";
import { PAST_BOTTLE_PANEL_TUNING } from "@/lib/entrance/past-bottle-panel-tuning";
import {
  MOOD_SELECT_ENTRANCE_DURATION_SCALE,
  PAST_BOTTLE_ENTRANCE_DELAY_SEC,
} from "@/lib/entrance/mood-select-entrance-tuning";
import { MOOD_SELECT_EXIT_SCALED } from "@/lib/entrance/mood-select-exit-timing";
import {
  MOOD_SELECT_BACKDROP_COLOR,
  MOOD_VIGNETTE_TUNING,
} from "@/lib/entrance/mood-vignette-tuning";
import type { BottleTagItem } from "@/lib/diaries/bottle-tag-item";
import {
  fallbackDrinkFromName,
  findCategoryIdForDrinkId,
  resolveDrinkFromBottleTag,
} from "@/lib/drinks/resolve-drink-from-bottle-tag";
import { parseBottleTag } from "@/lib/bottle-tag/parse-bottle-tag";
import type { Drink } from "@/lib/drinks/drink-catalog";
import type { DrinkCategoryId } from "@/lib/drinks/drink-catalog";
import { POST_RECORD_EXIT_TUNING } from "@/lib/entrance/post-record-exit-tuning";
import {
  DEFAULT_MEMORIES_LAUNCH,
  type MemoriesLaunch,
} from "@/lib/entrance/memories-launch";
import { MASTER_DECLINE_FAREWELL } from "@/lib/entrance/master-greetings";
import { DECLINE_NIGHT_TUNING } from "@/lib/entrance/decline-night-tuning";
import { AnimatePresence, motion } from "motion/react";
import { useSettingsMenuHidden } from "@/lib/settings/settings-menu-visibility";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type EntranceState =
  | "entry"
  | "memories"
  | "masterOnBlack"
  | "counterReveal"
  | "moodPrompt"
  | "moodSelect"
  | "pastBottleSelect"
  | "decliningNight"
  | "declineFarewellOnBlack"
  | "unheldNight"
  | "drinkServed"
  | "recording"
  | "postRecordBlackout"
  | "postRecordThanks"
  | "postRecordExitBlack"
  | "leaving"
  | "alley";

type DeclineOrigin = "moodSelect" | "pastBottleSelect";

const sceneExit = {
  exit: { opacity: 0, filter: "blur(10px)" },
  transition: { duration: 1.2 },
} as const;

const sceneExitInstant = {
  exit: { opacity: 0 },
  transition: { duration: 0 },
} as const;

type EntryTransition = "idle" | "doorExit" | "toMemories" | "steadyFadeIn";

const DEV_POST_RECORD_SKIP_STATES = new Set<EntranceState>([
  "counterReveal",
  "moodPrompt",
  "moodSelect",
  "pastBottleSelect",
  "drinkServed",
  "recording",
]);

const COUNTER_SCENE_STATES = new Set<EntranceState>([
  "counterReveal",
  "moodPrompt",
  "moodSelect",
  "pastBottleSelect",
  "decliningNight",
  "unheldNight",
  "drinkServed",
  "recording",
  "postRecordBlackout",
]);

/** 路地の環境音を鳴らすシーン（それ以外は店内＝outside 停止） */
const OUTSIDE_AMBIENT_STATES = new Set<EntranceState>([
  "entry",
  "memories",
  "leaving",
  "alley",
]);

const SETTINGS_MENU_RECORDING_STATES = new Set<EntranceState>([
  "recording",
  "postRecordBlackout",
  "postRecordThanks",
  "postRecordExitBlack",
  "leaving",
]);

function getSceneMotionKey(state: EntranceState): string {
  return COUNTER_SCENE_STATES.has(state) ? "counter" : state;
}

type EntranceFlowProps = {
  gateSnapshot: LoadingGateSnapshot;
};

export function EntranceFlow({ gateSnapshot }: EntranceFlowProps) {
  const session = useNightSession();
  const router = useRouter();
  const audio = useBarAudio();
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [entranceState, setEntranceState] = useState<EntranceState>("entry");
  const [pickedDrink, setPickedDrink] = useState<Drink | null>(null);
  const [pastMasterLine, setPastMasterLine] = useState<string | null>(null);
  const [alleyOutcome, setAlleyOutcome] = useState<NightAlleyOutcome | null>(
    null,
  );
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const declineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const postRecordExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const declineOriginRef = useRef<DeclineOrigin>("moodSelect");
  const [declineBlackoutReady, setDeclineBlackoutReady] = useState(false);
  const [declineFarewellExiting, setDeclineFarewellExiting] = useState(false);
  const farewellStartedRef = useRef(false);
  const saveExpectedRef = useRef(false);
  const leaveAnimationDoneRef = useRef(false);
  const alleyWaitStartedRef = useRef<number | null>(null);
  const [moodCameraPose, setMoodCameraPose] = useState<CameraPose>("neutral");
  const [moodSelectExitActive, setMoodSelectExitActive] = useState(false);
  const [moodAwaitingGrass, setMoodAwaitingGrass] = useState(false);
  const moodExitSkipRef = useRef<(() => void) | null>(null);
  const [drinkEnteringReveal, setDrinkEnteringReveal] = useState(false);
  const [drinkRevealSkipped, setDrinkRevealSkipped] = useState(false);
  const [drinkIntroSkipToSip, setDrinkIntroSkipToSip] = useState(false);
  const [drinkIntroFromGrass, setDrinkIntroFromGrass] = useState(false);
  const moodSelectVisitedRef = useRef(false);
  const moodThinkPlayedRef = useRef(false);
  const moodGrassPlayedRef = useRef(false);
  const [lampGlows, setLampGlows] = useState<CounterLampGlowConfig[]>(() =>
    mergeLampGlowsForShapeEdit().map((glow) => ({ ...glow })),
  );
  const [startLampGlows, setStartLampGlows] = useState<StartLampGlowConfig[]>(
    () => mergeStartLampGlowsForShapeEdit().map((glow) => ({ ...glow })),
  );
  const [startBokehLampGlows, setStartBokehLampGlows] = useState<
    StartBokehLampGlowConfig[]
  >(() => mergeStartBokehLampGlowsForShapeEdit().map((glow) => ({ ...glow })));
  const [startPositionGlows, setStartPositionGlows] = useState<
    StartLampGlowConfig[]
  >(() => START_LAMP_GLOWS.map((glow) => ({ ...glow })));
  const [bokehOnlyPositionGlows, setBokehOnlyPositionGlows] = useState<
    StartBokehLampGlowConfig[]
  >(() => START_BOKEH_ONLY_LAMP_GLOWS.map((glow) => ({ ...glow })));
  const [bokehOnlyLampGlows, setBokehOnlyLampGlows] = useState<
    StartBokehLampGlowConfig[]
  >(() => mergeStartBokehOnlyLampGlowsForShapeEdit().map((glow) => ({ ...glow })));
  const [selectedGlowId, setSelectedGlowId] = useState(
    COUNTER_LAMP_GLOWS[0]?.id ?? "",
  );
  const [selectedStartGlowId, setSelectedStartGlowId] = useState(
    START_LAMP_GLOWS[0]?.id ?? "",
  );
  const [selectedBokehOnlyGlowId, setSelectedBokehOnlyGlowId] = useState(
    START_BOKEH_ONLY_LAMP_GLOWS[0]?.id ?? "",
  );
  const [entryPhase, setEntryPhase] = useState<EntryScreenPhase>("bokeh");
  const [entryTransition, setEntryTransition] = useState<EntryTransition>("idle");
  const [skipEntryEntrance, setSkipEntryEntrance] = useState(false);
  const [devBackgroundOpacity, setDevBackgroundOpacity] = useState(
    START_BOKEH_BACKGROUND_OPACITY,
  );
  const [bokehShapeEditGroup, setBokehShapeEditGroup] = useState<
    "paired" | "bokeh-only"
  >("bokeh-only");
  const [memoriesLaunch, setMemoriesLaunch] = useState<MemoriesLaunch>(
    DEFAULT_MEMORIES_LAUNCH,
  );
  const [alleyDiaryFadeOut, setAlleyDiaryFadeOut] = useState(false);
  const [alleyHomeFadeOut, setAlleyHomeFadeOut] = useState(false);
  const [devSkipLoading, setDevSkipLoading] = useState(false);

  useSettingsMenuHidden("memories-list", entranceState === "memories");
  useSettingsMenuHidden(
    "recording-flow",
    SETTINGS_MENU_RECORDING_STATES.has(entranceState),
  );

  const unlockBarAudio = useCallback(() => {
    setAudioUnlocked((unlocked) => {
      if (unlocked) return unlocked;
      prepareBarAudioOnUserGesture();
      return true;
    });
  }, []);

  const primeBarAudioUnlock = useCallback(() => {
    unlockBarAudio();
  }, [unlockBarAudio]);

  /** 扉を開ける — jazz を無音で先行ロード（outside とは分離） */
  const primeCounterEntryAudio = useCallback(() => {
    primeBarAudioUnlock();
    audio.prepareJazzForCounterEntry();
  }, [primeBarAudioUnlock, audio]);

  const entryOutsideStartedRef = useRef(false);

  const resetEntryOutsideStarted = useCallback(() => {
    entryOutsideStartedRef.current = false;
  }, []);

  const startEntryOutsideAmbience = useCallback(() => {
    if (entranceState !== "entry" || entryTransition !== "idle") return;
    if (entryOutsideStartedRef.current && audio.isOutsidePlaying()) return;
    entryOutsideStartedRef.current = true;
    primeBarAudioUnlock();
    audio.primeOutsidePlayOnUserGesture();
    audio.prepareOutsideForEntry(
      skipEntryEntrance
        ? BAR_AUDIO_TIMING.fadeMs
        : BAR_AUDIO_TIMING.entryOutsideFadeMs,
    );
  }, [entranceState, entryTransition, skipEntryEntrance, audio, primeBarAudioUnlock]);

  const handleBackgroundTapForOutside = useCallback(() => {
    startEntryOutsideAmbience();
  }, [startEntryOutsideAmbience]);

  const handleGlowPatch = useCallback(
    (id: string, patch: Partial<LampGlowShapeFields>) => {
      setSelectedGlowId(id);
      setLampGlows((prev) => applyLampGlowShapePatch(prev, id, patch));
    },
    [],
  );

  const handleStartGlowPatch = useCallback(
    (id: string, patch: Partial<LampGlowShapeFields>) => {
      setSelectedStartGlowId(id);
      setStartLampGlows((prev) => applyStartLampGlowShapePatch(prev, id, patch));
    },
    [],
  );

  const handleStartBokehGlowPatch = useCallback(
    (id: string, patch: Partial<StartBokehLampGlowShapeFields>) => {
      setSelectedStartGlowId(id);
      setStartBokehLampGlows((prev) =>
        applyStartBokehLampGlowShapePatch(prev, id, patch),
      );
    },
    [],
  );

  const handleStartBokehOnlyGlowPatch = useCallback(
    (id: string, patch: Partial<StartBokehLampGlowShapeFields>) => {
      setSelectedBokehOnlyGlowId(id);
      setBokehOnlyLampGlows((prev) =>
        applyStartBokehOnlyLampGlowShapePatch(prev, id, patch),
      );
    },
    [],
  );

  const handleStartGlowMove = useCallback(
    (id: string, offsetX: number, offsetY: number) => {
      setSelectedStartGlowId(id);
      setStartPositionGlows((prev) =>
        prev.map((glow) =>
          glow.id === id ? { ...glow, offsetX, offsetY } : glow,
        ),
      );
    },
    [],
  );

  const handleBokehOnlyGlowMove = useCallback(
    (id: string, offsetX: number, offsetY: number) => {
      setSelectedBokehOnlyGlowId(id);
      setBokehOnlyPositionGlows((prev) =>
        prev.map((glow) =>
          glow.id === id ? { ...glow, offsetX, offsetY } : glow,
        ),
      );
    },
    [],
  );

  const lampGlowHomeEditing = isLampGlowHomeEditing();
  const startLampGlowHomeEditing = isStartLampGlowHomeEditing();
  const startBokehLampGlowHomeEditing = isStartBokehLampGlowHomeEditing();
  const startBokehOnlyPositionEditing = isStartBokehOnlyPositionEditing();
  const startBokehOnlyShapeEditing = isStartBokehOnlyShapeEditing();
  const startLampGlowPositionEditing = isStartLampGlowPositionEditing();
  const pairedBokehShapeEditing =
    startBokehLampGlowHomeEditing || startBokehOnlyShapeEditing;

  useEffect(() => {
    if (!lampGlowHomeEditing) return;
    saveLampGlowOverrides(lampGlows);
  }, [lampGlowHomeEditing, lampGlows]);

  useEffect(() => {
    if (!startLampGlowHomeEditing) return;
    saveStartLampGlowOverrides(startLampGlows);
  }, [startLampGlowHomeEditing, startLampGlows]);

  useEffect(() => {
    if (!pairedBokehShapeEditing) return;
    saveStartBokehLampGlowOverrides(startBokehLampGlows);
  }, [pairedBokehShapeEditing, startBokehLampGlows]);

  useEffect(() => {
    if (!startBokehOnlyShapeEditing) return;
    saveStartBokehOnlyLampGlowOverrides(bokehOnlyLampGlows);
  }, [startBokehOnlyShapeEditing, bokehOnlyLampGlows]);

  const drinkImageSrc = getDrinkImagePath(pickedDrink?.id);

  const clearTimers = useCallback(() => {
    for (const ref of [fadeTimerRef, declineTimerRef, postRecordExitTimerRef]) {
      if (ref.current) {
        clearTimeout(ref.current);
        ref.current = null;
      }
    }
  }, []);

  const resetNightRefs = useCallback(() => {
    farewellStartedRef.current = false;
    saveExpectedRef.current = false;
    leaveAnimationDoneRef.current = false;
    alleyWaitStartedRef.current = null;
    moodSelectVisitedRef.current = false;
    moodThinkPlayedRef.current = false;
    moodGrassPlayedRef.current = false;
    setDrinkEnteringReveal(false);
    setDrinkRevealSkipped(false);
    setDrinkIntroSkipToSip(false);
    setDrinkIntroFromGrass(false);
    setMoodSelectExitActive(false);
    setMoodAwaitingGrass(false);
    moodExitSkipRef.current = null;
    setMoodCameraPose("neutral");
    setAlleyOutcome(null);
  }, []);

  const returnToHomeSteady = useCallback(() => {
    clearTimers();
    session.reset();
    setPickedDrink(null);
    setPastMasterLine(null);
    resetNightRefs();
    resetEntryOutsideStarted();
    setMemoriesLaunch(DEFAULT_MEMORIES_LAUNCH);
    setAlleyDiaryFadeOut(false);
    setAlleyHomeFadeOut(false);
    setDeclineBlackoutReady(false);
    setDeclineFarewellExiting(false);
    setSkipEntryEntrance(true);
    setEntranceState("entry");
    setEntryTransition("steadyFadeIn");
    audio.stopJazz();
  }, [clearTimers, session, audio, resetNightRefs, resetEntryOutsideStarted]);

  const handleDismissAlley = useCallback(() => {
    if (alleyHomeFadeOut) return;
    setAlleyHomeFadeOut(true);
  }, [alleyHomeFadeOut]);

  const handleAlleyHomeFadeOutComplete = useCallback(() => {
    returnToHomeSteady();
  }, [returnToHomeSteady]);

  const handleAlleySpeakAgain = useCallback(() => {
    if (alleyOutcome?.kind !== "saveFailed") return;

    saveExpectedRef.current = false;
    farewellStartedRef.current = false;
    leaveAnimationDoneRef.current = false;
    alleyWaitStartedRef.current = null;
    setAlleyOutcome(null);

    audio.stopOutside();
    audio.startJazz(
      BAR_AUDIO_LEVELS.jazz.counter,
      BAR_AUDIO_TIMING.jazzEntryFadeMs,
    );

    void session.restartRecordingAfterPipelineFailure().then((started) => {
      if (started) {
        setEntranceState("recording");
      }
    });
  }, [alleyOutcome, session, audio]);

  const attemptGoToAlley = useCallback(() => {
    if (!leaveAnimationDoneRef.current) return;

    if (!saveExpectedRef.current) {
      markReturningVisitor();
      setAlleyOutcome({ kind: "unsaved" });
      setEntranceState("alley");
      return;
    }

    markReturningVisitor();

    const saveReady =
      session.saveStatus === "saved" && Boolean(session.savedDiaryId);

    if (session.isDevSimulated) {
      setAlleyOutcome({ kind: "devSaved" });
    } else if (saveReady) {
      alleyWaitStartedRef.current = null;
      setAlleyOutcome({
        kind: "saved",
        diaryId: session.savedDiaryId!,
      });
    } else if (
      session.generationFailed ||
      session.saveStatus === "failed"
    ) {
      alleyWaitStartedRef.current = null;
      setAlleyOutcome({ kind: "saveFailed" });
    } else {
      const startedAt = performance.now();
      alleyWaitStartedRef.current = startedAt;
      setAlleyOutcome({ kind: "composing", startedAt });
    }

    setEntranceState("alley");
  }, [
    session.isDevSimulated,
    session.saveStatus,
    session.savedDiaryId,
    session.generationFailed,
  ]);

  useEffect(() => {
    syncBarAudioUnlockFromClient(audioUnlocked);
    if (!audioUnlocked) return;

    if (entranceState === "memories") {
      audio.startOutside(BAR_AUDIO_LEVELS.outside.alley);
      return;
    }

    if (!OUTSIDE_AMBIENT_STATES.has(entranceState)) {
      audio.stopOutside();
    }
  }, [entranceState, entryTransition, audio, audioUnlocked]);

  useEffect(() => {
    if (entranceState === "moodSelect") {
      setMoodCameraPose("pondering");
    }
  }, [entranceState]);

  useEffect(() => {
    if (entranceState !== "moodSelect") return;
    if (moodSelectVisitedRef.current) return;
    if (moodThinkPlayedRef.current) return;

    moodThinkPlayedRef.current = true;
    audio.playThink();
  }, [entranceState, audio]);

  useEffect(() => {
    if (entranceState !== "drinkServed") return;
    if (moodGrassPlayedRef.current) {
      moodGrassPlayedRef.current = false;
      return;
    }
    audio.playGlassSlide();
  }, [entranceState, audio]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    if (session.phase === "recording" && entranceState !== "recording") {
      if (
        entranceState === "postRecordBlackout" ||
        entranceState === "postRecordThanks" ||
        entranceState === "postRecordExitBlack" ||
        entranceState === "leaving" ||
        entranceState === "alley"
      ) {
        return;
      }
      setEntranceState("recording");
    }
  }, [session.phase, entranceState]);

  useEffect(() => {
    if (session.isDevSimulated) return;
    if (entranceState !== "postRecordBlackout") return;
    if (session.phase !== "ending" && session.phase !== "revealed") return;

    saveExpectedRef.current = true;
    farewellStartedRef.current = true;
    setEntranceState("postRecordThanks");
    audio.startJazz(
      BAR_AUDIO_LEVELS.jazz.counter,
      BAR_AUDIO_TIMING.jazzEntryFadeMs,
    );
  }, [entranceState, session.phase, session.isDevSimulated, audio]);

  useEffect(() => {
    if (entranceState !== "postRecordBlackout") return;
    if (session.phase !== "recording" || !session.listenFailureVisible) return;
    setEntranceState("recording");
  }, [entranceState, session.phase, session.listenFailureVisible]);

  useEffect(() => {
    if (entranceState !== "alley") return;
    if (alleyOutcome?.kind !== "composing") return;

    if (session.saveStatus === "saved" && session.savedDiaryId) {
      const waitingInAlleyMs = alleyWaitStartedRef.current
        ? Math.round(performance.now() - alleyWaitStartedRef.current)
        : 0;
      session.recordWaitingInAlleyComplete(waitingInAlleyMs);
      alleyWaitStartedRef.current = null;
      setAlleyOutcome({
        kind: "saved",
        diaryId: session.savedDiaryId,
      });
      return;
    }

    if (session.generationFailed || session.saveStatus === "failed") {
      alleyWaitStartedRef.current = null;
      setAlleyOutcome({ kind: "saveFailed" });
    }
  }, [
    entranceState,
    alleyOutcome,
    session.saveStatus,
    session.savedDiaryId,
    session.generationFailed,
    session.recordWaitingInAlleyComplete,
  ]);

  useEffect(() => {
    if (!saveExpectedRef.current) return;
    if (
      session.saveStatus !== "saved" &&
      session.saveStatus !== "failed" &&
      !session.generationFailed
    ) {
      return;
    }
    if (!leaveAnimationDoneRef.current) return;
    if (entranceState === "alley" || entranceState === "memories") return;
    attemptGoToAlley();
  }, [
    session.saveStatus,
    session.generationFailed,
    session.savedDiaryId,
    entranceState,
    attemptGoToAlley,
  ]);

  useEffect(() => {
    if (entranceState !== "postRecordExitBlack") return;
    if (!leaveAnimationDoneRef.current) return;
    attemptGoToAlley();
  }, [entranceState, session.saveStatus, session.generationFailed, attemptGoToAlley]);

  const handleDevSkipToPostRecord = async () => {
    if (devSkipLoading) return;

    setDevSkipLoading(true);
    try {
      const drink = await session.prepareDevSkipFromLatestDiary();
      if (!drink) return;

      clearTimers();
      setMoodSelectExitActive(false);
      setDrinkEnteringReveal(false);
      setPickedDrink(drink);
      setPastMasterLine(null);
      saveExpectedRef.current = true;
      farewellStartedRef.current = true;
      leaveAnimationDoneRef.current = false;

      unlockBarAudio();
      setEntranceState("postRecordThanks");
      audio.startJazz(
        BAR_AUDIO_LEVELS.jazz.counter,
        BAR_AUDIO_TIMING.jazzEntryFadeMs,
      );
    } finally {
      setDevSkipLoading(false);
    }
  };

  const handleDeclineNight = () => {
    clearTimers();
    session.reset();
    setPickedDrink(null);
    setPastMasterLine(null);
    declineOriginRef.current =
      entranceState === "pastBottleSelect" ? "pastBottleSelect" : "moodSelect";
    setDeclineBlackoutReady(false);
    setDeclineFarewellExiting(false);
    audio.stopJazz();
    setEntranceState("decliningNight");

    declineTimerRef.current = setTimeout(() => {
      setDeclineBlackoutReady(true);

      declineTimerRef.current = setTimeout(() => {
        declineTimerRef.current = null;
        setDeclineBlackoutReady(false);
        resetNightRefs();
        setEntranceState("declineFarewellOnBlack");
      }, DECLINE_NIGHT_TUNING.blackoutHoldMs);
    }, DECLINE_NIGHT_TUNING.fadeMs);
  };

  const handleDeclineFarewellComplete = () => {
    setDeclineFarewellExiting(true);
  };

  const handleDeclineReturnFadeComplete = () => {
    clearTimers();
    session.reset();
    setPickedDrink(null);
    setPastMasterLine(null);
    resetNightRefs();
    resetEntryOutsideStarted();
    setDeclineBlackoutReady(false);
    setDeclineFarewellExiting(false);
    setSkipEntryEntrance(true);
    setEntranceState("entry");
    setEntryTransition("steadyFadeIn");
    audio.stopJazz();
  };

  const handleEnterCounter = () => {
    if (entryTransition !== "idle") return;
    resetNightRefs();
    resetEntryOutsideStarted();
    primeCounterEntryAudio();
    audio.stopOutside(false, BAR_AUDIO_TIMING.doorExitOutsideFadeMs);
    setEntryTransition("doorExit");
  };

  const handleDoorExitComplete = () => {
    setEntryTransition("idle");
    setEntranceState("masterOnBlack");
    fadeTimerRef.current = setTimeout(() => {
      fadeTimerRef.current = null;
      audio.playDoor();
    }, BAR_AUDIO_TIMING.doorDelayAfterEntryFadeMs);
  };

  const handleOpenMemories = () => {
    if (entryTransition !== "idle") return;
    setMemoriesLaunch(DEFAULT_MEMORIES_LAUNCH);
    startEntryOutsideAmbience();
    setEntryTransition("toMemories");
  };

  const handleOpenDiaryPaperMock = () => {
    if (entryTransition !== "idle") return;
    router.push("/lab/diary-paper");
  };

  const handleOpenSavedDiary = (diaryId: string) => {
    saveExpectedRef.current = false;
    setMemoriesLaunch({
      backdrop: "afterNight",
      initialDiaryId: diaryId,
    });
    setAlleyDiaryFadeOut(true);
  };

  const handleAlleyDiaryFadeOutComplete = () => {
    saveExpectedRef.current = false;
    setAlleyDiaryFadeOut(false);
    setEntranceState("memories");
  };

  const handleBackFromMemories = () => {
    if (memoriesLaunch.backdrop === "afterNight") {
      returnToHomeSteady();
      return;
    }
    handleBackToEntry();
  };

  const handleMemoriesFadeOutComplete = () => {
    setEntryTransition("idle");
    setEntranceState("memories");
  };

  const handleBackToEntry = () => {
    resetEntryOutsideStarted();
    setSkipEntryEntrance(true);
    setEntranceState("entry");
    setEntryTransition("steadyFadeIn");
  };

  const handleSteadyFadeInComplete = () => {
    setEntryTransition("idle");
    startEntryOutsideAmbience();
  };

  const handleMasterGreetingComplete = () => {
    unlockBarAudio();
    audio.startJazz(
      BAR_AUDIO_LEVELS.jazz.counter,
      BAR_AUDIO_TIMING.jazzEntryFadeMs,
    );
    setEntranceState("counterReveal");
  };

  const handleCounterRevealComplete = () => {
    setEntranceState("moodPrompt");
  };

  const handleSkipCounterReveal = () => {
    if (entranceState !== "counterReveal") return;
    unlockBarAudio();
    handleCounterRevealComplete();
  };

  const registerMoodExitSkip = useCallback((handler: (() => void) | null) => {
    moodExitSkipRef.current = handler;
  }, []);

  const handleSkipMoodExitToGrass = () => {
    if (!moodAwaitingGrass) return;
    unlockBarAudio();
    moodExitSkipRef.current?.();
  };

  const drinkRevealSkippable =
    drinkIntroFromGrass &&
    entranceState === "drinkServed" &&
    drinkEnteringReveal;

  const handleSkipDrinkReveal = () => {
    if (!drinkRevealSkippable) return;
    unlockBarAudio();
    setDrinkRevealSkipped(true);
    setDrinkIntroSkipToSip(true);
  };

  const handleMoodSelect = (categoryId: DrinkCategoryId, drink: Drink) => {
    setMoodAwaitingGrass(false);
    setPastMasterLine(null);
    session.selectCategory(categoryId, drink.id);
    setPickedDrink(drink);

    const finishToDrinkServed = () => {
      setMoodSelectExitActive(false);
      moodGrassPlayedRef.current = true;
      setDrinkIntroFromGrass(true);
      setEntranceState("drinkServed");
      setDrinkEnteringReveal(true);
    };

    const fallbackMs = MOOD_SELECT_EXIT_SCALED.grassFallbackDurationSec * 1000;
    const fallbackTimer = window.setTimeout(finishToDrinkServed, fallbackMs);

    let finished = false;
    const finishOnce = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(fallbackTimer);
      finishToDrinkServed();
    };

    audio.playGlassSlide({
      delayMs: 0,
      onEnded: finishOnce,
    });
  };

  const handlePastBottleOpen = () => {
    moodSelectVisitedRef.current = true;
    setEntranceState("pastBottleSelect");
  };

  const handlePastBottleSelect = (bottle: BottleTagItem) => {
    const resolved = resolveDrinkFromBottleTag(bottle.bottleTag);
    const drinkName = parseBottleTag(bottle.bottleTag).drinkName;
    const drink = resolved?.drink ?? fallbackDrinkFromName(drinkName || "Night Cap");
    const categoryId =
      resolved?.categoryId ??
      findCategoryIdForDrinkId(drink.id) ??
      ("clear" as DrinkCategoryId);

    session.selectPastBottle(categoryId, drink.id, {
      diaryId: bottle.id,
      bottleTag: bottle.bottleTag,
    });
    setPickedDrink(drink);
    setPastMasterLine(pickPastBottleMasterLine(bottle.bottleTag));
    setEntranceState("drinkServed");
  };

  const handleSip = () => {
    setDrinkIntroSkipToSip(false);
    unlockBarAudio();
    void session.startSpeaking().then((started) => {
      if (started) {
        setEntranceState("recording");
      }
    });
  };

  const handleFinishTalk = () => {
    setEntranceState("postRecordBlackout");
    session.stopSpeaking();
  };

  const handlePostRecordThanksComplete = () => {
    session.notifyStoreEndingComplete();

    if (postRecordExitTimerRef.current) {
      clearTimeout(postRecordExitTimerRef.current);
    }

    audio.stopJazz(POST_RECORD_EXIT_TUNING.jazzFadeOutMs);
    setEntranceState("postRecordExitBlack");

    postRecordExitTimerRef.current = setTimeout(() => {
      postRecordExitTimerRef.current = null;
      audio.playDoor({
        volumeScale: POST_RECORD_EXIT_TUNING.doorVolumeScale,
      });
      audio.startOutside(
        BAR_AUDIO_LEVELS.outside.leaving,
        POST_RECORD_EXIT_TUNING.outsideFadeInMs,
      );
    }, POST_RECORD_EXIT_TUNING.doorDelayMs);
  };

  const handlePostRecordExitComplete = () => {
    leaveAnimationDoneRef.current = true;
    attemptGoToAlley();
  };

  const handleLeaveWithoutRecord = () => {
    if (session.listenFailureCount < 2) return;

    saveExpectedRef.current = false;
    session.abandonNightWithoutRecord();
    setEntranceState("unheldNight");

    declineTimerRef.current = setTimeout(() => {
      farewellStartedRef.current = true;
      leaveAnimationDoneRef.current = false;
      audio.playDoor();
      audio.stopJazz();
      audio.startOutside(BAR_AUDIO_LEVELS.outside.leaving);
      setEntranceState("leaving");
    }, DECLINE_NIGHT_TUNING.fadeMs);
  };

  const handleLeavingComplete = () => {
    leaveAnimationDoneRef.current = true;
    attemptGoToAlley();
  };

  if (entranceState === "entry") {
    const entrySteadyLampGlows = startLampGlowPositionEditing
      ? startPositionGlows
      : startLampGlowHomeEditing
        ? startLampGlows
        : undefined;
    const entryBokehLampGlows = pairedBokehShapeEditing
      ? startBokehLampGlows
      : undefined;
    const entryBokehOnlyLampGlows = startBokehOnlyPositionEditing
      ? bokehOnlyPositionGlows
      : startBokehOnlyShapeEditing
        ? bokehOnlyLampGlows
        : undefined;

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="entry"
          {...(entryTransition === "toMemories" ? sceneExitInstant : sceneExit)}
          className="relative h-full w-full min-h-0"
        >
          <NightEntryScreen
            onEnterCounter={handleEnterCounter}
            onOpenMemories={handleOpenMemories}
            onOpenDiaryPaperMock={handleOpenDiaryPaperMock}
            onBackgroundTap={handleBackgroundTapForOutside}
            skipImageEntrance={skipEntryEntrance}
            steadyFadeIn={entryTransition === "steadyFadeIn"}
            onSteadyFadeInComplete={handleSteadyFadeInComplete}
            doorExiting={entryTransition === "doorExit"}
            onDoorExitComplete={handleDoorExitComplete}
            memoriesFadeOut={entryTransition === "toMemories"}
            onMemoriesFadeOutComplete={handleMemoriesFadeOutComplete}
            steadyLampGlows={entrySteadyLampGlows}
            bokehLampGlows={entryBokehLampGlows}
            bokehOnlyLampGlows={entryBokehOnlyLampGlows}
            devBackgroundOpacity={
              pairedBokehShapeEditing ||
              startBokehOnlyPositionEditing ||
              startBokehOnlyShapeEditing
                ? devBackgroundOpacity
                : undefined
            }
            onPhaseChange={setEntryPhase}
            freezeKenBurns={
              startLampGlowPositionEditing || startBokehOnlyPositionEditing
            }
          />
          {startLampGlowPositionEditing && (
            <StartLampGlowPositionEditor
              glows={startPositionGlows}
              selectedId={selectedStartGlowId}
              onSelect={setSelectedStartGlowId}
              onMove={handleStartGlowMove}
            />
          )}
          {startBokehOnlyPositionEditing &&
            START_BOKEH_ONLY_POSITION_EDIT_ON_HOME && (
              <StartBokehOnlyLampGlowPositionEditor
                glows={bokehOnlyPositionGlows}
                selectedId={selectedBokehOnlyGlowId}
                onSelect={setSelectedBokehOnlyGlowId}
                onMove={handleBokehOnlyGlowMove}
                backgroundOpacity={devBackgroundOpacity}
                onBackgroundOpacityChange={setDevBackgroundOpacity}
              />
            )}
          {startBokehOnlyShapeEditing &&
            START_BOKEH_ONLY_SHAPE_EDIT_ON_HOME &&
            (bokehShapeEditGroup === "bokeh-only" ? (
              <StartBokehOnlyLampGlowShapeEditor
                glows={bokehOnlyLampGlows}
                selectedId={selectedBokehOnlyGlowId}
                onSelect={setSelectedBokehOnlyGlowId}
                onPatch={handleStartBokehOnlyGlowPatch}
                currentPhase={entryPhase}
                backgroundOpacity={devBackgroundOpacity}
                onBackgroundOpacityChange={setDevBackgroundOpacity}
                groupTabs={
                  <div className="flex flex-wrap justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBokehShapeEditGroup("paired")}
                      className="rounded-full border border-stone-700/80 bg-black/70 px-3 py-1 font-mono text-[10px] text-stone-400 hover:border-stone-500"
                    >
                      ペア7灯
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-amber-400/80 bg-amber-950/80 px-3 py-1 font-mono text-[10px] text-amber-100"
                    >
                      ボケ専用15灯
                    </button>
                  </div>
                }
              />
            ) : (
              <StartBokehLampGlowShapeEditor
                glows={startBokehLampGlows}
                selectedId={selectedStartGlowId}
                onSelect={setSelectedStartGlowId}
                onPatch={handleStartBokehGlowPatch}
                currentPhase={entryPhase}
                backgroundOpacity={devBackgroundOpacity}
                onBackgroundOpacityChange={setDevBackgroundOpacity}
                groupTabs={
                  <div className="flex flex-wrap justify-center gap-1.5">
                    <button
                      type="button"
                      className="rounded-full border border-amber-400/80 bg-amber-950/80 px-3 py-1 font-mono text-[10px] text-amber-100"
                    >
                      ペア7灯
                    </button>
                    <button
                      type="button"
                      onClick={() => setBokehShapeEditGroup("bokeh-only")}
                      className="rounded-full border border-stone-700/80 bg-black/70 px-3 py-1 font-mono text-[10px] text-stone-400 hover:border-stone-500"
                    >
                      ボケ専用15灯
                    </button>
                  </div>
                }
              />
            ))}
          {startLampGlowHomeEditing && START_LAMP_GLOW_SHAPE_EDIT_ON_HOME && (
            <StartLampGlowShapeEditor
              glows={startLampGlows}
              selectedId={selectedStartGlowId}
              onSelect={setSelectedStartGlowId}
              onPatch={handleStartGlowPatch}
            />
          )}
          {startBokehLampGlowHomeEditing &&
            START_BOKEH_LAMP_GLOW_SHAPE_EDIT_ON_HOME &&
            !startBokehOnlyShapeEditing && (
              <StartBokehLampGlowShapeEditor
                glows={startBokehLampGlows}
                selectedId={selectedStartGlowId}
                onSelect={setSelectedStartGlowId}
                onPatch={handleStartBokehGlowPatch}
                currentPhase={entryPhase}
                backgroundOpacity={devBackgroundOpacity}
                onBackgroundOpacityChange={setDevBackgroundOpacity}
              />
            )}
        </motion.div>
      </AnimatePresence>
    );
  }

  if (entranceState === "memories") {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="memories" {...sceneExitInstant}>
          <MemoriesScreen
            onBack={handleBackFromMemories}
            initialDiaryId={memoriesLaunch.initialDiaryId}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (entranceState === "masterOnBlack") {
    return (
      <MasterOnBlackScreen
        returning={gateSnapshot.isReturningVisitor}
        onComplete={handleMasterGreetingComplete}
      />
    );
  }

  if (entranceState === "declineFarewellOnBlack") {
    return (
      <MasterOnBlackScreen
        lines={MASTER_DECLINE_FAREWELL}
        onComplete={handleDeclineFarewellComplete}
        exiting={declineFarewellExiting}
        onExitComplete={handleDeclineReturnFadeComplete}
        bubbleDelayMs={0}
      />
    );
  }

  if (entranceState === "postRecordThanks") {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="postRecordThanks" {...sceneExit}>
          <PostRecordThanksScene onComplete={handlePostRecordThanksComplete} />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (entranceState === "postRecordExitBlack") {
    return (
      <SceneFrame className="bg-black" atmosphere={false}>
        <PostRecordExitBlack onComplete={handlePostRecordExitComplete} />
      </SceneFrame>
    );
  }

  if (entranceState === "leaving") {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="leaving" {...sceneExit}>
          <LeavingScreen onComplete={handleLeavingComplete} />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (entranceState === "alley" && alleyOutcome) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="alley" {...sceneExit}>
          <NightAlleyScreen
            outcome={alleyOutcome}
            onDismiss={handleDismissAlley}
            onRetry={handleAlleySpeakAgain}
            onOpenDiary={handleOpenSavedDiary}
            diaryFadeOut={alleyDiaryFadeOut}
            onDiaryFadeOutComplete={handleAlleyDiaryFadeOutComplete}
            homeFadeOut={alleyHomeFadeOut}
            onHomeFadeOutComplete={handleAlleyHomeFadeOutComplete}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  const drinkOnCounter =
    entranceState === "drinkServed" ||
    entranceState === "recording";

  const showDrinkImage = drinkOnCounter;

  const showCounter =
    entranceState === "counterReveal" ||
    entranceState === "moodPrompt" ||
    entranceState === "moodSelect" ||
    entranceState === "pastBottleSelect" ||
    entranceState === "decliningNight" ||
    entranceState === "unheldNight" ||
    entranceState === "drinkServed" ||
    entranceState === "recording" ||
    entranceState === "postRecordBlackout";

  const reduceCounterGpuLoad =
    !lampGlowHomeEditing &&
    (entranceState === "moodSelect" || entranceState === "pastBottleSelect");

  const hideCounterDuringMoodExit = moodSelectExitActive;

  const declineOrigin = declineOriginRef.current;
  const isDeclineFading =
    entranceState === "decliningNight" && !declineBlackoutReady;
  const showMoodParallaxCamera =
    (entranceState === "moodSelect" ||
      entranceState === "pastBottleSelect" ||
      isDeclineFading) &&
    !moodSelectExitActive;
  const showMoodSelectChrome =
    (entranceState === "moodSelect" ||
      (isDeclineFading && declineOrigin === "moodSelect")) &&
    !lampGlowHomeEditing &&
    !(moodSelectExitActive && !moodAwaitingGrass);
  const showPastBottleChrome =
    entranceState === "pastBottleSelect" ||
    (isDeclineFading && declineOrigin === "pastBottleSelect");
  const showMoodVignette =
    (showMoodParallaxCamera || moodSelectExitActive) && !lampGlowHomeEditing;
  const showPastBottleLink =
    (entranceState === "moodSelect" ||
      entranceState === "pastBottleSelect" ||
      isDeclineFading) &&
    !moodSelectExitActive;
  const declineOverlayVisible =
    entranceState === "decliningNight" || entranceState === "unheldNight";

  const showRecordCounterScene =
    entranceState === "drinkServed" ||
    entranceState === "recording" ||
    entranceState === "postRecordBlackout";

  const skipMoodEntranceVisual =
    moodSelectVisitedRef.current || isDeclineFading;

  const showLegacyCounterScene = showCounter && !showRecordCounterScene;

  return (
    <AnimatePresence mode="wait">
      <motion.div key={getSceneMotionKey(entranceState)} {...sceneExit}>
        {showCounter && (
          entranceState === "decliningNight" && declineBlackoutReady ? (
            <SceneFrame className="bg-black" atmosphere={false}>
              {null}
            </SceneFrame>
          ) : (
          <SceneFrame atmosphere={!reduceCounterGpuLoad && !lampGlowHomeEditing}>
            <div
              className="absolute inset-0"
              style={{
                opacity: hideCounterDuringMoodExit ? 0 : 1,
                visibility: hideCounterDuringMoodExit ? "hidden" : "visible",
                transition: `opacity ${MOOD_SELECT_EXIT_SCALED.vignetteCloseDurationSec}s ease-in`,
              }}
            >
            {showLegacyCounterScene && (
            <CounterScene
              drinkImageSrc={showDrinkImage ? drinkImageSrc : null}
              drinkName={pickedDrink?.name ?? null}
              drinkNote={pickedDrink?.note ?? null}
              moodCategoryId={session.selectedCategoryId}
              drinkOnCounter={drinkOnCounter && Boolean(drinkImageSrc)}
              priority={entranceState === "counterReveal"}
              settle={entranceState !== "counterReveal"}
              reduceGpuLoad={reduceCounterGpuLoad}
              lampGlows={lampGlowHomeEditing ? lampGlows : undefined}
              showLampGlowLight
              cameraPose={showMoodParallaxCamera ? moodCameraPose : "neutral"}
              masterMode="idle"
            />
            )}

            {showRecordCounterScene && (
              <RecordCounterScene drinkId={pickedDrink?.id ?? null} />
            )}

            {showRecordCounterScene && pickedDrink && !drinkEnteringReveal && (
              <DrinkNameReveal drink={pickedDrink} />
            )}
            </div>

            {lampGlowHomeEditing && LAMP_GLOW_SHAPE_EDIT_ON_HOME && (
              <HomeLampGlowShapeEditor
                glows={lampGlows}
                selectedId={selectedGlowId}
                onSelect={setSelectedGlowId}
                onPatch={handleGlowPatch}
              />
            )}

            {entranceState === "counterReveal" && (
              <EnteringReveal onComplete={handleCounterRevealComplete} />
            )}

            <EntranceTapSkipLayer
              active={entranceState === "counterReveal"}
              onSkip={handleSkipCounterReveal}
              zIndex={20}
              ariaLabel="明転をスキップ"
            />

            {entranceState === "drinkServed" && drinkEnteringReveal && (
              <EnteringReveal
                backdropColor={MOOD_SELECT_BACKDROP_COLOR}
                skipped={drinkRevealSkipped}
                onComplete={() => {
                  setDrinkEnteringReveal(false);
                  setDrinkRevealSkipped(false);
                }}
              />
            )}

            <EntranceTapSkipLayer
              active={drinkRevealSkippable}
              onSkip={handleSkipDrinkReveal}
              zIndex={MOOD_VIGNETTE_TUNING.drinkPostGrassSkipZIndex}
              ariaLabel="明転をスキップ"
            />

            <EntranceTapSkipLayer
              active={moodAwaitingGrass}
              onSkip={handleSkipMoodExitToGrass}
              zIndex={MOOD_VIGNETTE_TUNING.moodExitSkipZIndex}
              ariaLabel="退場演出をスキップ"
            />

            {DEV_POST_RECORD_SKIP_STATES.has(entranceState) && (
              <DevPostRecordSkipButton
                onClick={() => void handleDevSkipToPostRecord()}
                loading={devSkipLoading}
              />
            )}

            <div
              className={`pointer-events-none absolute inset-0 flex flex-col ${
                isDeclineFading ? "pointer-events-none" : ""
              }`}
              style={{ zIndex: MOOD_VIGNETTE_TUNING.uiShellZIndex }}
            >
            {showMoodVignette && (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ zIndex: MOOD_VIGNETTE_TUNING.vignetteShellZIndex }}
                >
                  <MoodVignetteOverlay
                    durationScale={MOOD_SELECT_ENTRANCE_DURATION_SCALE}
                    instant={skipMoodEntranceVisual}
                    exiting={moodSelectExitActive}
                  />
                </div>
              )}

            {moodSelectExitActive && (
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  zIndex: MOOD_VIGNETTE_TUNING.vignetteShellZIndex - 1,
                  backgroundColor: MOOD_SELECT_BACKDROP_COLOR,
                }}
              />
            )}

            {showPastBottleLink && !lampGlowHomeEditing && (
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 overflow-visible px-7"
                  style={{
                    paddingTop: `${PAST_BOTTLE_LINK_TUNING.headerTopPercent}%`,
                    zIndex: MOOD_VIGNETTE_TUNING.pastBottleLinkZIndex,
                  }}
                >
                  <div
                    className={`overflow-visible ${
                      isDeclineFading || entranceState === "pastBottleSelect"
                        ? "pointer-events-none"
                        : "pointer-events-auto"
                    }`}
                  >
                    <PastBottleLink
                      onClick={handlePastBottleOpen}
                      skipEntrance={skipMoodEntranceVisual}
                      entranceDelaySec={
                        skipMoodEntranceVisual
                          ? 0
                          : PAST_BOTTLE_ENTRANCE_DELAY_SEC
                      }
                      locked={
                        entranceState === "pastBottleSelect" ||
                        (isDeclineFading &&
                          declineOrigin === "pastBottleSelect")
                      }
                    />
                  </div>
                </div>
              )}

            {entranceState === "moodPrompt" && !lampGlowHomeEditing && (
              <div className="pointer-events-auto absolute inset-0">
                <MasterMoodPromptPanel
                  onComplete={() => setEntranceState("moodSelect")}
                />
              </div>
            )}

            {entranceState === "drinkServed" && !drinkEnteringReveal && (
              <div className="pointer-events-auto absolute inset-0">
                <DrinkRecordIntroPanel
                  onSip={handleSip}
                  skipToSip={drinkIntroSkipToSip}
                />
              </div>
            )}

            {showMoodSelectChrome && (
              <div
                className={`absolute inset-0 ${
                  isDeclineFading ? "pointer-events-none" : "pointer-events-auto"
                }`}
                style={{ zIndex: MOOD_VIGNETTE_TUNING.uiShellZIndex }}
              >
                <MoodSelectScene
                  skipPastBottleEntrance={moodSelectVisitedRef.current}
                  onSelectionStart={() => {
                    setMoodSelectExitActive(true);
                    setMoodAwaitingGrass(true);
                    setMoodCameraPose("neutral");
                  }}
                  onRegisterExitSkip={registerMoodExitSkip}
                  onSelect={handleMoodSelect}
                  onDecline={handleDeclineNight}
                />
              </div>
            )}

            <div className="flex-1" />

            {showPastBottleChrome && (
              <div
                className={`absolute inset-x-0 flex items-center justify-center ${
                  isDeclineFading ? "pointer-events-none" : "pointer-events-auto"
                }`}
                style={{
                  top: `${PAST_BOTTLE_PANEL_TUNING.topInsetPercent}%`,
                  bottom: `${PAST_BOTTLE_PANEL_TUNING.bottomInsetPercent}%`,
                  paddingLeft: PAST_BOTTLE_PANEL_TUNING.horizontalPaddingPx,
                  paddingRight: PAST_BOTTLE_PANEL_TUNING.horizontalPaddingPx,
                  zIndex: MOOD_VIGNETTE_TUNING.uiShellZIndex,
                }}
              >
                <PastBottlePanel
                  onSelect={handlePastBottleSelect}
                  onBackToMood={() => setEntranceState("moodSelect")}
                  onDecline={handleDeclineNight}
                />
              </div>
            )}

            <div
              className={`space-y-5 px-5 pb-[12%] pt-4 ${
                isDeclineFading ? "pointer-events-none" : "pointer-events-auto"
              }`}
            >
              {entranceState === "unheldNight" && (
                <MasterLine>……そういう夜もある。</MasterLine>
              )}

              {entranceState === "recording" && (
                <RecordingPanel
                  listenFailureCount={session.listenFailureCount}
                  listenFailureVisible={session.listenFailureVisible}
                  listenFailureReason={session.listenFailureReason}
                  onFinish={handleFinishTalk}
                  onRetrySpeaking={() => void session.retrySpeaking()}
                  onLeaveWithoutRecord={handleLeaveWithoutRecord}
                  onPauseSpeaking={() => session.pauseSpeaking()}
                  onResumeSpeaking={() => session.resumeSpeaking()}
                />
              )}
            </div>
            </div>

            {entranceState === "postRecordBlackout" && (
              <motion.div
                className="pointer-events-none absolute inset-0 z-[40]"
                style={{ backgroundColor: POST_RECORD_EXIT_TUNING.softBlackColor }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: POST_RECORD_EXIT_TUNING.softBlackFadeInMs / 1000,
                }}
              />
            )}

            <div
              className={`pointer-events-none absolute inset-0 bg-black transition-opacity ${
                declineOverlayVisible ? "opacity-100" : "opacity-0"
              }`}
              style={{
                zIndex: DECLINE_NIGHT_TUNING.overlayZIndex,
                transitionDuration: `${DECLINE_NIGHT_TUNING.fadeMs}ms`,
              }}
            />
          </SceneFrame>
          )
        )}
      </motion.div>
    </AnimatePresence>
  );
}
