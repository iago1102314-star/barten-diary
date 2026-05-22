"use client";

import { saveAiDiary } from "@/app/(app)/diaries/actions";
import { CounterScene } from "@/components/entrance/counter-scene";
import { LeavingScreen } from "@/components/entrance/leaving-screen";
import { MasterLine } from "@/components/entrance/master-line";
import { MoodSelectPanel } from "@/components/entrance/mood-select-panel";
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
  | "leaving";

const FIRST_VISIT_INTRO_MS = 1400;
const RETURNING_INTRO_MS = 700;
const FADE_MS = 650;
const DECLINE_FADE_MS = 650;

export function EntranceFlow() {
  const session = useNightSession();
  const router = useRouter();
  const audio = useBarAudio();
  const [entranceState, setEntranceState] = useState<EntranceState>("entry");
  const [pickedDrink, setPickedDrink] = useState<Drink | null>(null);
  const [pastMasterLine, setPastMasterLine] = useState<string | null>(null);
  const introTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const declineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveAttemptedRef = useRef(false);
  const lastSavedTranscriptRef = useRef<string | null>(null);
  const farewellStartedRef = useRef(false);
  const saveExpectedRef = useRef(false);
  const leaveAnimationDoneRef = useRef(false);
  const saveStateRef = useRef<"idle" | "saving" | "done" | "failed">("idle");

  const drinkImageSrc = getDrinkImagePath(pickedDrink?.id);

  const clearTimers = useCallback(() => {
    for (const ref of [introTimerRef, fadeTimerRef, declineTimerRef]) {
      if (ref.current) {
        clearTimeout(ref.current);
        ref.current = null;
      }
    }
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

    saveExpectedRef.current = true;
    saveStateRef.current = "idle";
    saveAttemptedRef.current = false;
    farewellStartedRef.current = true;

    markReturningVisitor();
    audio.setRainVolume(0.32);
    audio.playDoor();
    setEntranceState("leaving");
  }, [session.phase, audio]);

  const resetToAlley = useCallback(() => {
    clearTimers();
    session.reset();
    setPickedDrink(null);
    setPastMasterLine(null);
    saveAttemptedRef.current = false;
    lastSavedTranscriptRef.current = null;
    farewellStartedRef.current = false;
    saveExpectedRef.current = false;
    leaveAnimationDoneRef.current = false;
    saveStateRef.current = "idle";
    setEntranceState("entry");
    audio.setRainVolume(0.35);
  }, [clearTimers, session, audio]);

  const attemptReturnToAlley = useCallback(() => {
    if (!leaveAnimationDoneRef.current) return;

    if (!saveExpectedRef.current) {
      resetToAlley();
      return;
    }

    if (saveStateRef.current === "done" || saveStateRef.current === "failed") {
      resetToAlley();
    }
  }, [resetToAlley]);

  useEffect(() => {
    if (session.phase !== "revealed" || !session.record || !session.transcript) {
      return;
    }
    if (lastSavedTranscriptRef.current === session.transcript) return;
    if (saveStateRef.current === "saving" || saveStateRef.current === "done") {
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
    saveAttemptedRef.current = true;
    saveStateRef.current = "saving";

    void (async () => {
      const result = await saveAiDiary(payload);

      if (result.error) {
        console.error("Background save failed:", result.error);
        lastSavedTranscriptRef.current = null;
        saveAttemptedRef.current = false;
        saveStateRef.current = "failed";
        attemptReturnToAlley();
        return;
      }

      saveStateRef.current = "done";
      router.refresh();
      attemptReturnToAlley();
    })();
  }, [
    session.phase,
    session.record,
    session.transcript,
    session.continuedFrom,
    router,
    attemptReturnToAlley,
  ]);

  useEffect(() => {
    if (!saveExpectedRef.current || !leaveAnimationDoneRef.current) return;
    if (saveStateRef.current === "done" || saveStateRef.current === "failed") {
      return;
    }
    if (session.generationStatus !== "error") return;

    saveStateRef.current = "failed";
    attemptReturnToAlley();
  }, [session.generationStatus, attemptReturnToAlley]);

  const handleDeclineNight = () => {
    clearTimers();
    session.reset();
    setPickedDrink(null);
    setPastMasterLine(null);
    saveAttemptedRef.current = false;
    lastSavedTranscriptRef.current = null;
    farewellStartedRef.current = false;
    saveExpectedRef.current = false;
    leaveAnimationDoneRef.current = false;
    saveStateRef.current = "idle";
    setEntranceState("decliningNight");

    declineTimerRef.current = setTimeout(() => {
      resetToAlley();
    }, DECLINE_FADE_MS);
  };

  const handleEnterCounter = () => {
    saveAttemptedRef.current = false;
    lastSavedTranscriptRef.current = null;
    farewellStartedRef.current = false;
    saveExpectedRef.current = false;
    leaveAnimationDoneRef.current = false;
    saveStateRef.current = "idle";
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
    markReturningVisitor();
    setEntranceState("unheldNight");

    declineTimerRef.current = setTimeout(() => {
      farewellStartedRef.current = true;
      audio.setRainVolume(0.32);
      audio.playDoor();
      setEntranceState("leaving");
    }, DECLINE_FADE_MS);
  };

  const handleLeavingComplete = () => {
    leaveAnimationDoneRef.current = true;
    attemptReturnToAlley();
  };

  if (entranceState === "entry") {
    return <NightEntryScreen onEnterCounter={handleEnterCounter} />;
  }

  if (entranceState === "leaving") {
    return <LeavingScreen onComplete={handleLeavingComplete} />;
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
    entranceState === "processing";

  return (
    <div className="space-y-4">
      {showCounter && (
        <SceneFrame className="rounded-xl">
          <CounterScene
            drinkImageSrc={
              entranceState === "fadeIn" ||
              entranceState === "counterIntro" ||
              entranceState === "moodSelect" ||
              entranceState === "pastBottleSelect"
                ? null
                : drinkImageSrc
            }
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
                : entranceState === "processing"
                  ? "opacity-60"
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
                <MoodSelectPanel
                  onSelect={handleMoodSelect}
                  onPastBottle={handlePastBottleOpen}
                  onDecline={handleDeclineNight}
                />
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
                <p className="text-center text-[12px] tracking-wide text-stone-500/80">
                  ……言葉を整理している。
                </p>
              )}
            </div>
          </div>
        </SceneFrame>
      )}

    </div>
  );
}
