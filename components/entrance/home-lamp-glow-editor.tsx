"use client";

import type { CounterLampGlowConfig } from "@/lib/entrance/counter-lamp-glows";

type HomeLampGlowPositionPanelProps = {
  glows: CounterLampGlowConfig[];
  selectedId: string;
  onSelect: (id: string) => void;
  onMove: (id: string, offsetX: number, offsetY: number) => void;
};

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/** 位置調整 — TS 用座標 + ▲▼◀▶ */
export function HomeLampGlowEditor({
  glows,
  selectedId,
  onSelect,
  onMove,
}: HomeLampGlowPositionPanelProps) {
  const selected = glows.find((glow) => glow.id === selectedId) ?? glows[0];
  if (!selected) return null;

  const nudge = (dx: number, dy: number) => {
    onMove(
      selected.id,
      clampPercent(selected.offsetX + dx),
      clampPercent(selected.offsetY + dy),
    );
  };

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-[5%] z-[90] flex justify-center px-4">
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

        <p className="text-[9px] text-stone-500">counter-lamp-glows.ts に書く値</p>
        <p className="text-[12px] text-stone-200">
          offsetX: <span className="text-amber-100">{selected.offsetX}</span>
          {" · "}
          offsetY: <span className="text-amber-100">{selected.offsetY}</span>
        </p>

        <div className="grid grid-cols-3 gap-1">
          <span />
          <button
            type="button"
            aria-label="上へ"
            onClick={() => nudge(0, -1)}
            className="flex h-9 w-9 items-center justify-center rounded border border-stone-600 bg-stone-900 text-stone-200 hover:border-stone-400"
          >
            ▲
          </button>
          <span />
          <button
            type="button"
            aria-label="左へ"
            onClick={() => nudge(-1, 0)}
            className="flex h-9 w-9 items-center justify-center rounded border border-stone-600 bg-stone-900 text-stone-200 hover:border-stone-400"
          >
            ◀
          </button>
          <span />
          <button
            type="button"
            aria-label="右へ"
            onClick={() => nudge(1, 0)}
            className="flex h-9 w-9 items-center justify-center rounded border border-stone-600 bg-stone-900 text-stone-200 hover:border-stone-400"
          >
            ▶
          </button>
          <span />
          <button
            type="button"
            aria-label="下へ"
            onClick={() => nudge(0, 1)}
            className="flex h-9 w-9 items-center justify-center rounded border border-stone-600 bg-stone-900 text-stone-200 hover:border-stone-400"
          >
            ▼
          </button>
          <span />
        </div>
      </div>
    </div>
  );
}
