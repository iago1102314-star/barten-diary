"use client";

import { saveAiDiary } from "@/app/(app)/diaries/actions";
import { CounterScene } from "@/components/entrance/counter-scene";
import { DevSkipNightButton } from "@/components/entrance/dev-skip-night-button";
import { LeavingScreen } from "@/components/entrance/leaving-screen";
import { MasterLine } from "@/components/entrance/master-line";
import { MoodSelectPanel } from "@/components/entrance/mood-select-panel";
import { NightAlleyScreen } from "@/components/entrance/night-alley-screen";
import { NightEntryScreen } from "@/components/entrance/night-entry-screen";
import { PastBottlePanel } from "@/components/entrance/past-bottle-panel";
import { RecordingPanel } from "@/components/entrance/recording-panel";
import { SceneFrame } from "@/components/entrance/scene-frame";
import { useBarAudio } from "@/hooks/use-bar-audio";
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
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type EntranceState =
  | "entry"
  | "fadeIn"
  | "counterIntro"
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

const FIRST_VISIT_INTRO_MS = 1400;
const RETURNING_INTRO_MS = 700;
const FADE_MS = 650;
const DECLINE_FADE_MS = 650;
const COUNTER_FAREWELL_MS = 1400;

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
  const introTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const drinkImageSrc = getDrinkImagePath(pickedDrink?.id);

  const clearTimers = useCallback(() => {
    for (const ref of [
      introTimerRef,
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
    audio.setRainVolume(0.35);
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
      audio.startRain(0.35);
    }
  }, [entranceState, audio]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    if (entranceState !== "counterIntro") return;

    const introMs = isReturningVisitor()
      ? RETURNING_INTRO_MS
      : FIRST_VISIT_INTRO_MS;

    introTimerRef.current = setTimeout(() => {
      setEntranceState("moodSelect");
    }, introMs);

    return () => {
      if (introTimerRef.current) {
        clearTimeout(introTimerRef.current);
        introTimerRef.current = null;
      }
    };
  }, [entranceState]);

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
      audio.setRainVolume(0.32);
      audio.playDoor();
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
    audio.playBell();
    audio.playDoor();
    audio.setRainVolume(0.18);
    setEntranceState("fadeIn");

    fadeTimerRef.current = setTimeout(() => {
      setEntranceState("counterIntro");
    }, FADE_MS);
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
      audio.setRainVolume(0.32);
      audio.playDoor();
      setEntranceState("leaving");
    }, DECLINE_FADE_MS);
  };

  const handleLeavingComplete = () => {
    leaveAnimationDoneRef.current = true;
    attemptGoToAlley();
  };

  if (entranceState === "entry") {
    return <NightEntryScreen onEnterCounter={handleEnterCounter} />;
  }

  if (entranceState === "leaving") {
    return <LeavingScreen onComplete={handleLeavingComplete} />;
  }

  if (entranceState === "alley" && alleyOutcome) {
    return (
      <NightAlleyScreen outcome={alleyOutcome} onDismiss={resetToAlley} />
    );
  }

  const showCounter =
    entranceState === "fadeIn" ||
    entranceState === "counterIntro" ||
    entranceState === "moodSelect" ||
    entranceState === "pastBottleSelect" ||
    entranceState === "decliningNight" ||
    entranceState === "unheldNight" ||
    entranceState === "drinkServed" ||
    entranceState === "recording" ||
    entranceState === "processing" ||
    entranceState === "counterFarewell";

  const showDrinkImage =
    entranceState !== "fadeIn" &&
    entranceState !== "counterIntro" &&
    entranceState !== "moodSelect" &&
    entranceState !== "pastBottleSelect";

  return (
    <div className="space-y-4">
      {showCounter && (
        <SceneFrame className="rounded-xl">
          <CounterScene
            drinkImageSrc={showDrinkImage ? drinkImageSrc : null}
            priority={
              entranceState === "fadeIn" || entranceState === "counterIntro"
            }
          />

          <div
            className={`pointer-events-none absolute inset-0 z-20 bg-black transition-opacity duration-500 ${
              entranceState === "fadeIn" ||
              entranceState === "decliningNight" ||
              entranceState === "unheldNight"
                ? "opacity-100"
                : "opacity-0"
            }`}
          />

          <div className="pointer-events-none absolute inset-0 z-30 flex flex-col">
            <div className="flex-1" />

            <div className="pointer-events-auto space-y-5 px-5 pb-[12%] pt-4">
              {entranceState === "counterIntro" && (
                <MasterLine>……いらっしゃい。</MasterLine>
              )}

              {entranceState === "moodSelect" && (
                <>
                  <MoodSelectPanel
                    onSelect={handleMoodSelect}
                    onPastBottle={handlePastBottleOpen}
                    onDecline={handleDeclineNight}
                  />
                  <DevSkipNightButton onSkip={handleDevSkipNight} />
                </>
              )}

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
                <div className="space-y-5">
                  {pastMasterLine && <MasterLine>{pastMasterLine}</MasterLine>}
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={handleSip}
                      className="rounded-full border border-stone-700/50 bg-stone-950/55 px-9 py-2.5 text-sm tracking-wide text-stone-200/90 backdrop-blur-sm transition-colors hover:border-stone-600/60"
                    >
                      口をつける
                    </button>
                  </div>
                </div>
              )}

              {entranceState === "recording" && (
                <>
                  <RecordingPanel
                    listenFailureCount={session.listenFailureCount}
                    listenFailureVisible={session.listenFailureVisible}
                    onFinish={handleFinishTalk}
                    onRetrySpeaking={() => void session.retrySpeaking()}
                    onLeaveWithoutRecord={handleLeaveWithoutRecord}
                    onPauseSpeaking={() => session.pauseSpeaking()}
                    onResumeSpeaking={() => session.resumeSpeaking()}
                  />
                  <DevSkipNightButton onSkip={handleDevSkipNight} />
                </>
              )}

              {entranceState === "counterFarewell" && counterFarewellLine && (
                <MasterLine>{counterFarewellLine}</MasterLine>
              )}
            </div>
          </div>
        </SceneFrame>
      )}
    </div>
  );
}
