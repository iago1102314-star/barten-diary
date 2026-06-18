"use client";

import { saveAiDiary } from "@/app/(app)/diaries/actions";
import { CounterScene } from "@/components/entrance/counter-scene";
import { DrinkServedPanel } from "@/components/entrance/drink-served-panel";
import { MasterHeadDevTapZone } from "@/components/entrance/master-head-dev-tap";
import { EnteringReveal } from "@/components/entrance/entering-reveal";
import { GeneratingPanel } from "@/components/entrance/generating-panel";
import { LeavingScreen } from "@/components/entrance/leaving-screen";
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
import { RecordingPanel } from "@/components/entrance/recording-panel";
import { SceneFrame } from "@/components/entrance/scene-frame";
import { useBarAudio } from "@/hooks/use-bar-audio";
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
import {
  isReturningVisitor,
  markReturningVisitor,
} from "@/lib/entrance/visit-state";
import type {
  BackgroundWorkState,
  NightAlleyOutcome,
} from "@/lib/entrance/night-outcome";
import { getDrinkImagePath } from "@/lib/entrance/drink-image-path";
import { pickPastBottleMasterLine } from "@/lib/entrance/past-bottle-master-line";
import type { BottleTagItem } from "@/lib/diaries/bottle-tag-item";
import {
  fallbackDrinkFromName,
  findCategoryIdForDrinkId,
  resolveDrinkFromBottleTag,
} from "@/lib/drinks/resolve-drink-from-bottle-tag";
import { parseBottleTag } from "@/lib/bottle-tag/parse-bottle-tag";
import type { Drink } from "@/lib/drinks/drink-catalog";
import type { DrinkCategoryId } from "@/lib/drinks/drink-catalog";
import { pickCounterFarewellLine } from "@/lib/night/counter-farewell-lines";
import { AnimatePresence, motion } from "motion/react";
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
  | "unheldNight"
  | "drinkServed"
  | "recording"
  | "processing"
  | "counterFarewell"
  | "leaving"
  | "alley";

const DECLINE_FADE_MS = 800;
const COUNTER_FAREWELL_MS = 2000;

const sceneExit = {
  exit: { opacity: 0, filter: "blur(10px)" },
  transition: { duration: 1.2 },
} as const;

const sceneExitInstant = {
  exit: { opacity: 0 },
  transition: { duration: 0 },
} as const;

type EntryTransition = "idle" | "doorExit" | "toMemories" | "steadyFadeIn";

const COUNTER_SCENE_STATES = new Set<EntranceState>([
  "counterReveal",
  "moodPrompt",
  "moodSelect",
  "pastBottleSelect",
  "decliningNight",
  "unheldNight",
  "drinkServed",
  "recording",
  "processing",
  "counterFarewell",
]);

/** 路地の環境音を鳴らすシーン（それ以外は店内＝outside 停止） */
const OUTSIDE_AMBIENT_STATES = new Set<EntranceState>([
  "entry",
  "memories",
  "leaving",
  "alley",
]);

function getSceneMotionKey(state: EntranceState): string {
  return COUNTER_SCENE_STATES.has(state) ? "counter" : state;
}

export function EntranceFlow() {
  const session = useNightSession();
  const router = useRouter();
  const audio = useBarAudio();
  const [entranceState, setEntranceState] = useState<EntranceState>("entry");
  const [pickedDrink, setPickedDrink] = useState<Drink | null>(null);
  const [pastMasterLine, setPastMasterLine] = useState<string | null>(null);
  const [counterFarewellLine, setCounterFarewellLine] = useState<string | null>(
    null,
  );
  const [alleyOutcome, setAlleyOutcome] = useState<NightAlleyOutcome | null>(
    null,
  );
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const declineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counterFarewellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastSavedTranscriptRef = useRef<string | null>(null);
  const farewellStartedRef = useRef(false);
  const saveExpectedRef = useRef(false);
  const leaveAnimationDoneRef = useRef(false);
  const backgroundWorkRef = useRef<BackgroundWorkState>("idle");
  const savedDiaryIdRef = useRef<string | null>(null);
  const [moodCameraPose, setMoodCameraPose] = useState<CameraPose>("neutral");
  const moodSelectVisitedRef = useRef(false);
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
    for (const ref of [
      fadeTimerRef,
      declineTimerRef,
      counterFarewellTimerRef,
    ]) {
      if (ref.current) {
        clearTimeout(ref.current);
        ref.current = null;
      }
    }
  }, []);

  const resetNightRefs = useCallback(() => {
    lastSavedTranscriptRef.current = null;
    farewellStartedRef.current = false;
    saveExpectedRef.current = false;
    leaveAnimationDoneRef.current = false;
    backgroundWorkRef.current = "idle";
    savedDiaryIdRef.current = null;
    moodSelectVisitedRef.current = false;
    setMoodCameraPose("neutral");
    setCounterFarewellLine(null);
    setAlleyOutcome(null);
  }, []);

  const resetToAlley = useCallback(() => {
    clearTimers();
    session.reset();
    setPickedDrink(null);
    setPastMasterLine(null);
    resetNightRefs();
    setEntranceState("entry");
    audio.stopJazz();
    audio.startOutside(
      BAR_AUDIO_LEVELS.outside.alley,
      BAR_AUDIO_TIMING.entryOutsideFadeMs,
    );
  }, [clearTimers, session, audio, resetNightRefs]);

  const attemptGoToAlley = useCallback(() => {
    if (!leaveAnimationDoneRef.current) return;

    if (!saveExpectedRef.current) {
      markReturningVisitor();
      setAlleyOutcome({ kind: "unsaved" });
      setEntranceState("alley");
      return;
    }

    if (backgroundWorkRef.current === "pending") return;

    markReturningVisitor();

    if (backgroundWorkRef.current === "devSaved") {
      setAlleyOutcome({ kind: "devSaved" });
    } else if (backgroundWorkRef.current === "saved" && savedDiaryIdRef.current) {
      setAlleyOutcome({
        kind: "saved",
        diaryId: savedDiaryIdRef.current,
      });
    } else {
      setAlleyOutcome({ kind: "saveFailed" });
    }

    setEntranceState("alley");
  }, []);

  useEffect(() => {
    if (entranceState === "entry") {
      audio.startOutside(
        BAR_AUDIO_LEVELS.outside.alley,
        skipEntryEntrance
          ? BAR_AUDIO_TIMING.fadeMs
          : BAR_AUDIO_TIMING.entryOutsideFadeMs,
      );
      return;
    }

    if (entranceState === "memories") {
      audio.startOutside(BAR_AUDIO_LEVELS.outside.alley);
      return;
    }

    if (!OUTSIDE_AMBIENT_STATES.has(entranceState)) {
      audio.stopOutside();
    }
  }, [entranceState, skipEntryEntrance, audio]);

  useEffect(() => {
    if (entranceState === "moodSelect") {
      setMoodCameraPose("pondering");
    }
  }, [entranceState]);

  useEffect(() => {
    if (entranceState !== "drinkServed") return;
    audio.playGlassSlide();
  }, [entranceState, audio]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    if (session.phase === "recording" && entranceState !== "recording") {
      if (
        entranceState === "processing" ||
        entranceState === "counterFarewell" ||
        entranceState === "leaving" ||
        entranceState === "alley"
      ) {
        return;
      }
      setEntranceState("recording");
    }
  }, [session.phase, entranceState]);

  useEffect(() => {
    if (session.phase === "processing" || session.phase === "accepted") {
      setEntranceState("processing");
    }
  }, [session.phase]);

  useEffect(() => {
    if (session.phase === "recording" && session.listenFailureVisible) {
      setEntranceState("recording");
    }
  }, [session.phase, session.listenFailureVisible]);

  useEffect(() => {
    if (session.phase !== "revealed") return;
    if (farewellStartedRef.current) return;

    farewellStartedRef.current = true;
    saveExpectedRef.current = true;

    if (session.isDevSimulated) {
      backgroundWorkRef.current = "devSaved";
    } else {
      backgroundWorkRef.current = "pending";
      savedDiaryIdRef.current = null;
    }

    setCounterFarewellLine(pickCounterFarewellLine());
    setEntranceState("counterFarewell");

    counterFarewellTimerRef.current = setTimeout(() => {
      audio.playDoor();
      audio.stopJazz();
      audio.startOutside(BAR_AUDIO_LEVELS.outside.leaving);
      setEntranceState("leaving");
    }, COUNTER_FAREWELL_MS);
  }, [session.phase, session.isDevSimulated, audio]);

  useEffect(() => {
    if (session.isDevSimulated) return;
    if (session.phase !== "revealed" || !session.record || !session.transcript) {
      return;
    }
    if (lastSavedTranscriptRef.current === session.transcript) return;
    if (
      backgroundWorkRef.current === "saved" ||
      backgroundWorkRef.current === "failed"
    ) {
      return;
    }

    const payload = {
      bottleTag: session.record.bottleTag,
      diary: session.record.diary,
      drinkNote: session.record.drinkNote,
      masterComment: session.record.masterComment,
      transcript: session.transcript,
      continuedFromDiaryId: session.continuedFrom?.diaryId ?? null,
      continuedFromBottleTag: session.continuedFrom?.bottleTag ?? null,
    };

    lastSavedTranscriptRef.current = session.transcript;

    void (async () => {
      const result = await saveAiDiary(payload);

      if (result.error || !result.success || !result.diaryId) {
        console.error("Background save failed:", result.error);
        lastSavedTranscriptRef.current = null;
        backgroundWorkRef.current = "failed";
        attemptGoToAlley();
        return;
      }

      savedDiaryIdRef.current = result.diaryId;
      backgroundWorkRef.current = "saved";
      router.refresh();
      attemptGoToAlley();
    })();
  }, [
    session.phase,
    session.isDevSimulated,
    session.record,
    session.transcript,
    session.continuedFrom,
    router,
    attemptGoToAlley,
  ]);

  useEffect(() => {
    if (session.isDevSimulated) return;
    if (!saveExpectedRef.current) return;
    if (backgroundWorkRef.current !== "pending") return;
    if (session.generationStatus !== "error") return;

    backgroundWorkRef.current = "failed";
    attemptGoToAlley();
  }, [session.generationStatus, session.isDevSimulated, attemptGoToAlley]);

  const handleDevSkipNight = () => {
    const drink = session.simulateDevNight();
    if (!drink) return;
    setPickedDrink(drink);
    setPastMasterLine(null);
  };

  const handleDeclineNight = () => {
    clearTimers();
    session.reset();
    setPickedDrink(null);
    setPastMasterLine(null);
    resetNightRefs();
    setEntranceState("decliningNight");

    declineTimerRef.current = setTimeout(() => {
      resetToAlley();
    }, DECLINE_FADE_MS);
  };

  const handleEnterCounter = () => {
    if (entryTransition !== "idle") return;
    resetNightRefs();
    void audio.warmUp();
    audio.stopOutside(false, BAR_AUDIO_TIMING.outsideStopFadeMs);
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
    setEntryTransition("toMemories");
  };

  const handleMemoriesFadeOutComplete = () => {
    setEntryTransition("idle");
    setEntranceState("memories");
  };

  const handleBackToEntry = () => {
    setSkipEntryEntrance(true);
    setEntranceState("entry");
    setEntryTransition("steadyFadeIn");
  };

  const handleSteadyFadeInComplete = () => {
    setEntryTransition("idle");
  };

  const handleMasterGreetingComplete = () => {
    audio.startJazz(
      BAR_AUDIO_LEVELS.jazz.counter,
      BAR_AUDIO_TIMING.jazzEntryFadeMs,
    );
    setEntranceState("counterReveal");
  };

  const handleCounterRevealComplete = () => {
    setEntranceState("moodPrompt");
  };

  const handleMoodSelect = (categoryId: DrinkCategoryId, drink: Drink) => {
    setPastMasterLine(null);
    session.selectCategory(categoryId, drink.id);
    setPickedDrink(drink);
    setEntranceState("drinkServed");
  };

  const handlePastBottleOpen = () => {
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
    void session.startSpeaking();
    setEntranceState("recording");
  };

  const handleFinishTalk = () => {
    session.stopSpeaking();
    setEntranceState("processing");
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
    }, DECLINE_FADE_MS);
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
          className="relative"
        >
          <NightEntryScreen
            onEnterCounter={handleEnterCounter}
            onOpenMemories={handleOpenMemories}
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
          <MemoriesScreen onBack={handleBackToEntry} />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (entranceState === "masterOnBlack") {
    return (
      <MasterOnBlackScreen
        returning={isReturningVisitor()}
        onComplete={handleMasterGreetingComplete}
      />
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
          <NightAlleyScreen outcome={alleyOutcome} onDismiss={resetToAlley} />
        </motion.div>
      </AnimatePresence>
    );
  }

  const drinkOnCounter =
    entranceState === "drinkServed" ||
    entranceState === "recording" ||
    entranceState === "processing" ||
    entranceState === "counterFarewell";

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
    entranceState === "processing" ||
    entranceState === "counterFarewell";

  const reduceCounterGpuLoad =
    !lampGlowHomeEditing &&
    (entranceState === "moodSelect" || entranceState === "pastBottleSelect");

  return (
    <AnimatePresence mode="wait">
      <motion.div key={getSceneMotionKey(entranceState)} {...sceneExit}>
        {showCounter && (
          <SceneFrame atmosphere={!reduceCounterGpuLoad && !lampGlowHomeEditing}>
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
              cameraPose={
                entranceState === "moodSelect" ||
                entranceState === "pastBottleSelect"
                  ? moodCameraPose
                  : "neutral"
              }
              masterMode={
                entranceState === "recording" ? "talking" : "idle"
              }
            />

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

            <MasterHeadDevTapZone onTripleTap={handleDevSkipNight} />

            <div
              className={`pointer-events-none absolute inset-0 z-20 bg-black transition-opacity duration-[800ms] ${
                entranceState === "decliningNight" ||
                entranceState === "unheldNight"
                  ? "opacity-100"
                  : "opacity-0"
              }`}
            />

            <div className="pointer-events-none absolute inset-0 z-30 flex flex-col">
            {entranceState === "moodPrompt" && !lampGlowHomeEditing && (
              <div className="pointer-events-auto absolute inset-0">
                <MasterMoodPromptPanel
                  onComplete={() => setEntranceState("moodSelect")}
                />
              </div>
            )}

            {entranceState === "moodSelect" && !lampGlowHomeEditing && (
              <div className="pointer-events-auto absolute inset-0">
                <MoodSelectScene
                  skipCurtainEntrance={moodSelectVisitedRef.current}
                  skipPastBottleEntrance={moodSelectVisitedRef.current}
                  onCurtainEntranceComplete={() => {
                    moodSelectVisitedRef.current = true;
                  }}
                  onSelectionStart={() => setMoodCameraPose("neutral")}
                  onSelect={handleMoodSelect}
                  onPastBottle={handlePastBottleOpen}
                  onDecline={handleDeclineNight}
                />
              </div>
            )}

            <div className="flex-1" />

            <div className="pointer-events-auto space-y-5 px-5 pb-[12%] pt-4">
              {entranceState === "pastBottleSelect" && (
                <PastBottlePanel
                  onSelect={handlePastBottleSelect}
                  onBackToMood={() => setEntranceState("moodSelect")}
                  onDecline={handleDeclineNight}
                />
              )}

              {entranceState === "decliningNight" && (
                <MasterLine>……そういう日もある。</MasterLine>
              )}

              {entranceState === "unheldNight" && (
                <MasterLine>……そういう夜もある。</MasterLine>
              )}

              {entranceState === "drinkServed" && (
                <DrinkServedPanel
                  pastMasterLine={pastMasterLine}
                  onSip={handleSip}
                />
              )}

              {entranceState === "recording" && (
                <RecordingPanel
                  listenFailureCount={session.listenFailureCount}
                  listenFailureVisible={session.listenFailureVisible}
                  onFinish={handleFinishTalk}
                  onRetrySpeaking={() => void session.retrySpeaking()}
                  onLeaveWithoutRecord={handleLeaveWithoutRecord}
                  onPauseSpeaking={() => session.pauseSpeaking()}
                  onResumeSpeaking={() => session.resumeSpeaking()}
                />
              )}

              {entranceState === "processing" && (
                <GeneratingPanel
                  failed={session.generationFailed}
                  onRetry={session.retryGeneration}
                />
              )}

              {entranceState === "counterFarewell" && counterFarewellLine && (
                <MasterLine>{counterFarewellLine}</MasterLine>
              )}
            </div>
          </div>
        </SceneFrame>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
