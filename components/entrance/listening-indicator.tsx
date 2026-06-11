"use client";

/**
 * マスターが黙って耳を傾けている「気配」。
 * 派手なインジケータではなく、灯りが静かに息づくだけ。
 */
export function ListeningIndicator({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3" aria-hidden>
      <div className="relative h-2.5 w-2.5">
        <span className="animate-ambient-breathe absolute inset-0 rounded-full bg-amber-300/70 blur-[2px]" />
        <span className="absolute inset-0 rounded-full bg-amber-200/40" />
      </div>
      {label && (
        <p className="text-[11px] tracking-[0.22em] text-stone-500/70">
          {label}
        </p>
      )}
    </div>
  );
}
