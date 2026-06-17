"use client";

import type { LampGlowConfigBase } from "@/lib/entrance/lamp-glow-types";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type PositionEditableGlow = Pick<
  LampGlowConfigBase,
  "id" | "label" | "offsetX" | "offsetY"
>;

type LampGlowPositionEditorProps<T extends PositionEditableGlow> = {
  glows: T[];
  selectedId: string;
  onSelect: (id: string) => void;
  onMove: (id: string, offsetX: number, offsetY: number) => void;
  /** 画面下部に表示する TS ファイル名 */
  targetFile: string;
  /** 調整UI — rain-alley 背景 opacity（0〜1） */
  backgroundOpacity?: number;
  onBackgroundOpacityChange?: (value: number) => void;
  /** 背景 opacity の確定値定数名（表示用） */
  backgroundOpacityConstant?: string;
  backgroundOpacityFileValue?: number;
};

const HOLD_DELAY_MS = 350;
const HOLD_INTERVAL_MS = 70;

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function NudgeButton({
  label,
  onNudge,
  children,
}: {
  label: string;
  onNudge: () => void;
  children: ReactNode;
}) {
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nudgeRef = useRef(onNudge);
  nudgeRef.current = onNudge;

  const stopHold = useCallback(() => {
    if (delayRef.current) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startHold = useCallback(() => {
    stopHold();
    nudgeRef.current();
    delayRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => nudgeRef.current(), HOLD_INTERVAL_MS);
    }, HOLD_DELAY_MS);
  }, [stopHold]);

  useEffect(() => () => stopHold(), [stopHold]);

  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        startHold();
      }}
      onPointerUp={stopHold}
      onPointerCancel={stopHold}
      onLostPointerCapture={stopHold}
      className="flex h-9 w-9 touch-none select-none items-center justify-center rounded border border-stone-600 bg-stone-900 text-stone-200 hover:border-stone-400 active:border-amber-500/80 active:bg-stone-800"
    >
      {children}
    </button>
  );
}

/** 位置調整 — TS 用座標 + ▲▼◀▶（長押しで連続移動） */
export function LampGlowPositionEditor<T extends PositionEditableGlow>({
  glows,
  selectedId,
  onSelect,
  onMove,
  targetFile,
  backgroundOpacity,
  onBackgroundOpacityChange,
  backgroundOpacityConstant,
  backgroundOpacityFileValue,
}: LampGlowPositionEditorProps<T>) {
  const [panelHidden, setPanelHidden] = useState(false);
  const glowsRef = useRef(glows);
  const selectedIdRef = useRef(selectedId);
  glowsRef.current = glows;
  selectedIdRef.current = selectedId;

  const selected = glows.find((glow) => glow.id === selectedId) ?? glows[0];

  const nudge = useCallback(
    (dx: number, dy: number) => {
      const current =
        glowsRef.current.find((glow) => glow.id === selectedIdRef.current) ??
        glowsRef.current[0];
      if (!current) return;

      onMove(
        current.id,
        clampPercent(current.offsetX + dx),
        clampPercent(current.offsetY + dy),
      );
    },
    [onMove],
  );

  if (!selected) return null;

  if (panelHidden) {
    return (
      <div className="pointer-events-auto absolute inset-x-0 bottom-[4%] z-[90] flex justify-center px-3">
        <button
          type="button"
          onClick={() => setPanelHidden(false)}
          className="rounded-full border border-stone-600/80 bg-black/85 px-4 py-2 font-mono text-[11px] text-stone-300 backdrop-blur-sm hover:border-stone-400"
        >
          UIを表示
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-[4%] z-[90] flex flex-col items-center gap-2 px-3">
      <button
        type="button"
        onClick={() => setPanelHidden(true)}
        className="rounded-full border border-stone-700/80 bg-black/70 px-3 py-1 font-mono text-[10px] text-stone-400 hover:border-stone-500"
      >
        調整UIを一時非表示
      </button>

      <div className="flex w-full max-w-xs flex-col items-center gap-2 rounded-lg border border-stone-700/80 bg-black/90 px-4 py-3 font-mono backdrop-blur-sm">
        <div className="flex flex-wrap justify-center gap-1.5">
          {glows.map((glow) => (
            <button
              key={glow.id}
              type="button"
              onClick={() => onSelect(glow.id)}
              className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                glow.id === selectedId
                  ? "border-red-400/80 bg-red-950/80 text-red-200"
                  : "border-stone-700/80 text-stone-500 hover:border-stone-500"
              }`}
            >
              {glow.label}
            </button>
          ))}
        </div>

        {backgroundOpacity != null && onBackgroundOpacityChange && (
          <label className="flex w-full items-center gap-2 text-[11px] text-stone-300">
            <span className="w-12 shrink-0 text-stone-500">背景</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={backgroundOpacity}
              onChange={(event) =>
                onBackgroundOpacityChange(Number.parseFloat(event.target.value))
              }
              className="min-w-0 flex-1 accent-amber-500"
            />
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={backgroundOpacity}
              onChange={(event) =>
                onBackgroundOpacityChange(Number.parseFloat(event.target.value))
              }
              className="w-14 shrink-0 rounded border border-stone-700 bg-stone-950 px-1 py-0.5 text-center text-stone-200"
            />
          </label>
        )}
        {backgroundOpacityConstant && backgroundOpacityFileValue != null && (
          <p className="text-[9px] text-stone-600">
            確定値 → {backgroundOpacityConstant}（現在 {backgroundOpacityFileValue}）
          </p>
        )}

        <p className="text-[9px] text-stone-500">{targetFile} に書く値</p>
        <p className="text-[12px] text-stone-200">
          offsetX: <span className="text-amber-100">{selected.offsetX}</span>
          {" · "}
          offsetY: <span className="text-amber-100">{selected.offsetY}</span>
        </p>

        <div className="grid grid-cols-3 gap-1">
          <span />
          <NudgeButton label="上へ" onNudge={() => nudge(0, -1)}>
            ▲
          </NudgeButton>
          <span />
          <NudgeButton label="左へ" onNudge={() => nudge(-1, 0)}>
            ◀
          </NudgeButton>
          <span />
          <NudgeButton label="右へ" onNudge={() => nudge(1, 0)}>
            ▶
          </NudgeButton>
          <span />
          <NudgeButton label="下へ" onNudge={() => nudge(0, 1)}>
            ▼
          </NudgeButton>
          <span />
        </div>
      </div>
    </div>
  );
}
