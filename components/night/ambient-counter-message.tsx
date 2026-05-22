"use client";

type AmbientCounterMessageProps = {
  lines: string[];
};

export function AmbientCounterMessage({ lines }: AmbientCounterMessageProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-8 border-t border-stone-800/60 pt-5 text-center transition-opacity duration-700"
    >
      {lines.map((line) => (
        <p
          key={line}
          className="text-[13px] leading-relaxed tracking-wide text-stone-500/90"
        >
          {line}
        </p>
      ))}
    </div>
  );
}
