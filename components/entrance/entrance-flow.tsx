"use client";

import { saveAiDiary } from "@/app/(app)/diaries/actions";
import { CounterScene } from "@/components/entrance/counter-scene";
import { DrinkServedPanel } from "@/components/entrance/drink-served-panel";
import { MasterHeadDevTapZone } from "@/components/entrance/master-head-dev-tap";
import { EnteringReveal } from "@/components/entrance/entering-reveal";
import { EntryFadeOutScreen } from "@/components/entrance/entry-fade-out-screen";
import { GeneratingPanel } from "@/components/entrance/generating-panel";
import { LeavingScreen } from "@/components/entrance/leaving-screen";
import { MasterMoodPromptPanel } from "@/components/entrance/master-mood-prompt-panel";
import { MasterOnBlackScreen } from "@/components/entrance/master-on-black-screen";
import { MasterLine } from "@/components/entrance/master-line";
import { MemoriesScreen } from "@/components/entrance/memories-screen";
import { MoodSelectScene } from "@/components/entrance/mood-select-scene";
import { NightAlleyScreen } from "@/components/entrance/night-alley-screen";
import { NightEntryScreen } from "@/components/entrance/night-entry-screen";
import { PastBottlePanel } from "@/components/entrance/past-bottle-panel";
import { RecordingPanel } from "@/components/entrance/recording-panel";
import { SceneFrame } from "@/components/entrance/scene-frame";
import { useBarAudio } from "@/hooks/use-bar-audio";
import {
  BAR_AUDIO_LEVELS,
  BAR_AUDIO_TIMING,
} from "@/lib/entrance/audio-levels";
import type { CameraPose } from "@/lib/entrance/counter-camera-poses";
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
  | "entryFadeOut"
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
    audio.startOutside(BAR_AUDIO_LEVELS.outside.alley);
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
    if (entranceState === "entry" || entranceState === "memories") {
      audio.startOutside(BAR_AUDIO_LEVELS.outside.alley);
      return;
    }

    if (!OUTSIDE_AMBIENT_STATES.has(entranceState)) {
      audio.stopOutside();
    }
  }, [entranceState, audio]);

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
    if (session.phase === "processing") {
      setEntranceState("processing");
    }
  }, [session.phase]);

  useEffect(() => {
    if (session.phase === "recording" && session.listenFailureVisible) {
      setEntranceState("recording");
    }
  }, [session.phase, session.listenFailureVisible]);

  useEffect(() => {
    if (session.phase !== "accepted") return;
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
    resetNightRefs();
    void audio.warmUp();
    audio.stopOutside();
    setEntranceState("entryFadeOut");
  };

  const handleEntryFadeComplete = () => {
    setEntranceState("masterOnBlack");
    fadeTimerRef.current = setTimeout(() => {
      fadeTimerRef.current = null;
      audio.playDoor();
    }, BAR_AUDIO_TIMING.doorDelayAfterEntryFadeMs);
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

  const handleOpenMemories = () => {
    setEntranceState("memories");
  };

  const handleBackToEntry = () => {
    setEntranceState("entry");
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
    return (
      <AnimatePresence mode="wait">
        <motion.div key="entry" {...sceneExit}>
          <NightEntryScreen
            onEnterCounter={handleEnterCounter}
            onOpenMemories={handleOpenMemories}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (entranceState === "memories") {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="memories" {...sceneExit}>
          <MemoriesScreen onBack={handleBackToEntry} />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (entranceState === "entryFadeOut") {
    return (
      <EntryFadeOutScreen onFadeComplete={handleEntryFadeComplete} />
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
    entranceState === "moodSelect" || entranceState === "pastBottleSelect";

  return (
    <AnimatePresence mode="wait">
      <motion.div key={getSceneMotionKey(entranceState)} {...sceneExit}>
        {showCounter && (
          <SceneFrame atmosphere={!reduceCounterGpuLoad}>
            <CounterScene
              drinkImageSrc={showDrinkImage ? drinkImageSrc : null}
              drinkName={pickedDrink?.name ?? null}
              drinkNote={pickedDrink?.note ?? null}
              moodCategoryId={session.selectedCategoryId}
              drinkOnCounter={drinkOnCounter && Boolean(drinkImageSrc)}
              priority={entranceState === "counterReveal"}
              settle={entranceState !== "counterReveal"}
              reduceGpuLoad={reduceCounterGpuLoad}
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
            {entranceState === "moodPrompt" && (
              <div className="pointer-events-auto absolute inset-0">
                <MasterMoodPromptPanel
                  onComplete={() => setEntranceState("moodSelect")}
                />
              </div>
            )}

            {entranceState === "moodSelect" && (
              <div className="pointer-events-auto absolute inset-0">
                <MoodSelectScene
                  skipCurtainEntrance={moodSelectVisitedRef.current}
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

              {entranceState === "processing" && <GeneratingPanel />}

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
