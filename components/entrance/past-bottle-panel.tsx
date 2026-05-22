"use client";

import { DeclineNightLink } from "@/components/entrance/decline-night-link";
import type { BottleTagItem } from "@/lib/diaries/bottle-tag-item";
import { useEffect, useState } from "react";

type PastBottlePanelProps = {
  onSelect: (bottle: BottleTagItem) => void;
  onBackToMood: () => void;
  onDecline: () => void;
  declineDisabled?: boolean;
};

export function PastBottlePanel({
  onSelect,
  onBackToMood,
  onDecline,
  declineDisabled = false,
}: PastBottlePanelProps) {
  const [bottles, setBottles] = useState<BottleTagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/bottle-tags");
        const data = (await res.json()) as {
          bottles?: BottleTagItem[];
          error?: string;
        };

        if (!res.ok) {
          throw new Error(data.error ?? "読み込めませんでした");
        }

        if (!cancelled) {
          setBottles(data.bottles ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "読み込めませんでした");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-sm space-y-3 px-2">
      <button
        type="button"
        onClick={onBackToMood}
        disabled={declineDisabled}
        className="text-[11px] tracking-[0.16em] text-stone-600 transition-colors hover:text-stone-400 disabled:opacity-40"
      >
        今夜の気分へ
      </button>

      {loading && (
        <p className="py-8 text-center text-[12px] tracking-wide text-stone-600">
          ……
        </p>
      )}

      {error && (
        <p className="py-6 text-center text-[12px] text-stone-500">{error}</p>
      )}

      {!loading && !error && bottles.length === 0 && (
        <p className="rounded-lg border border-dashed border-stone-800/60 px-4 py-10 text-center text-[12px] leading-relaxed text-stone-600">
          まだ、開けるボトルはない。
        </p>
      )}

      {!loading && !error && bottles.length > 0 && (
        <ul className="max-h-[34dvh] space-y-2 overflow-y-auto pr-1">
          {bottles.map((bottle) => (
            <li key={bottle.id}>
              <button
                type="button"
                onClick={() => onSelect(bottle)}
                disabled={declineDisabled}
                className="w-full rounded-lg border border-stone-800/55 bg-stone-950/40 px-4 py-3 text-left transition-colors hover:border-stone-700/60 hover:bg-stone-950/55 disabled:opacity-40"
              >
                <p className="font-mono text-[11px] tracking-[0.06em] text-amber-200/70">
                  {bottle.bottleTag}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <DeclineNightLink onDecline={onDecline} disabled={declineDisabled} />
    </div>
  );
}
