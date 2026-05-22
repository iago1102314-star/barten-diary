export function ShelfDivider() {
  return (
    <div className="flex items-center gap-3 py-2" aria-hidden>
      <span className="h-px flex-1 bg-stone-800/90" />
      <span className="text-[10px] tracking-[0.35em] text-stone-700/80">
        ──────
      </span>
      <span className="h-px flex-1 bg-stone-800/90" />
    </div>
  );
}
