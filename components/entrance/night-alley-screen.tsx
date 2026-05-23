"use client";

import { SceneFrame } from "@/components/entrance/scene-frame";
import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import type { NightAlleyOutcome } from "@/lib/entrance/night-outcome";
import Image from "next/image";
import Link from "next/link";

type NightAlleyScreenProps = {
  outcome: NightAlleyOutcome;
  onDismiss: () => void;
};

const outcomeTextClass =
  "text-[13px] font-light leading-relaxed tracking-[0.08em] text-stone-300/82";
const actionClass =
  "text-[11px] tracking-[0.22em] text-stone-500/75 transition-colors hover:text-stone-400/90";
const linkClass =
  "text-[11px] tracking-[0.22em] text-stone-400/80 transition-colors hover:text-stone-300/90";

/** 夜を終えた後の帰り道 — 入口の雨路地とは別背景 */
export function NightAlleyScreen({ outcome, onDismiss }: NightAlleyScreenProps) {
  return (
    <SceneFrame className="rounded-xl">
      <Image
        src={ENTRANCE_ASSETS.afterNight}
        alt=""
        fill
        priority
        sizes="420px"
        className="object-cover"
        draggable={false}
        unoptimized
      />
      <div className="absolute inset-0 bg-black/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/15 to-transparent" />
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-end px-8 pb-[20%] pt-16">
        <div className="w-full max-w-xs space-y-8 text-center">
          {outcome.kind === "saved" && (
            <>
              <p className={outcomeTextClass}>今夜の記録を残しました。</p>
              <div className="flex flex-col items-center gap-5">
                <Link
                  href={`/diaries/${outcome.diaryId}`}
                  onClick={onDismiss}
                  className={linkClass}
                >
                  記録を開く
                </Link>
                <button type="button" onClick={onDismiss} className={actionClass}>
                  また今度読む
                </button>
              </div>
            </>
          )}

          {outcome.kind === "devSaved" && (
            <>
              <p className={outcomeTextClass}>今夜の記録を残しました。</p>
              <p className="text-[10px] font-light tracking-[0.06em] text-stone-500/65">
                （DEV — 今回は保存していません）
              </p>
              <button type="button" onClick={onDismiss} className={actionClass}>
                また今度読む
              </button>
            </>
          )}

          {outcome.kind === "saveFailed" && (
            <>
              <p className={outcomeTextClass}>……今夜はうまく預かれなかった。</p>
              <button type="button" onClick={onDismiss} className={actionClass}>
                また今度読む
              </button>
            </>
          )}

          {outcome.kind === "unsaved" && (
            <button type="button" onClick={onDismiss} className={actionClass}>
              また今度読む
            </button>
          )}
        </div>
      </div>
    </SceneFrame>
  );
}
