"use client";

import { DrinkCategoryMenu } from "@/components/night/drink-category-menu";
import { NightRecordCard } from "@/components/night/night-record-card";
import { ShelfReturnButton } from "@/components/night/shelf-return-button";
import { useNightSession } from "@/hooks/use-night-session";
import {
  canLeaveWithoutRecord,
  listenFailureMasterLines,
} from "@/lib/night/listen-failure";

export function NightSession() {
  const session = useNightSession();
  const canSpeak = session.selectedCategoryId !== null;

  return (
    <section className="night-glow rounded-2xl border border-stone-800/80 bg-stone-950/60 px-6 py-10 text-center backdrop-blur-sm">
      {session.phase === "idle" && (
        <div className="space-y-6">
          <DrinkCategoryMenu
            selectedId={session.selectedCategoryId}
            onSelect={session.selectCategory}
          />
          <button
            type="button"
            onClick={() => void session.startSpeaking()}
            disabled={!canSpeak}
            className="mx-auto rounded-full border border-amber-700/30 bg-amber-950/50 px-10 py-3.5 text-sm font-medium tracking-wide text-amber-100/90 transition-all hover:border-amber-600/50 hover:bg-amber-900/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            話す
          </button>
        </div>
      )}

      {session.phase === "recording" &&
        session.listenFailureVisible &&
        session.listenFailureCount > 0 && (
          <div className="space-y-3 py-2">
            {listenFailureMasterLines(session.listenFailureCount).map((line) => (
              <p
                key={line}
                className="text-[13px] leading-relaxed tracking-wide text-stone-500/90"
              >
                {line}
              </p>
            ))}
            <button
              type="button"
              onClick={() => void session.retrySpeaking()}
              className="mx-auto block text-sm text-stone-400 transition-colors hover:text-stone-300"
            >
              もう一度話す
            </button>
            {canLeaveWithoutRecord(session.listenFailureCount) && (
              <button
                type="button"
                onClick={session.abandonNightWithoutRecord}
                className="mx-auto block text-sm text-stone-500 transition-colors hover:text-stone-400"
              >
                今夜はこの辺にしておく
              </button>
            )}
          </div>
        )}

      {session.phase === "recording" &&
        !session.listenFailureVisible && (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-2 text-amber-200/80">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500/60 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            <span className="text-sm tracking-widest">listening</span>
          </div>
          <button
            type="button"
            onClick={session.stopSpeaking}
            className="mx-auto rounded-full border border-stone-600/50 px-8 py-2.5 text-sm text-stone-400 transition-colors hover:border-stone-500 hover:text-stone-300"
          >
            止める
          </button>
        </div>
      )}

      {session.phase === "processing" && (
        <div className="space-y-3 py-4">
          <p className="animate-pulse text-sm tracking-wide text-stone-500">
            ……言葉を整理している。
          </p>
        </div>
      )}

      {session.phase === "revealed" && session.record && session.transcript && (
        <div className="space-y-6 text-left">
          <NightRecordCard record={session.record} />
          <ShelfReturnButton
            record={session.record}
            transcript={session.transcript}
            onReturned={session.reset}
          />
        </div>
      )}

    </section>
  );
}
