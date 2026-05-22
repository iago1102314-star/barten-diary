type ShelfWineNoteProps = {
  text: string;
};

/**
 * 酒名の下 — 棚メモ1ブロック + Master
 */
export function ShelfWineNote({ text }: ShelfWineNoteProps) {
  return (
    <div className="mt-1 max-w-xs space-y-3 text-center">
      <p className="whitespace-pre-wrap text-[13px] leading-[1.85] tracking-wide text-stone-500/88">
        {text}
      </p>
      <p className="text-[10px] tracking-[0.35em] text-stone-700/85 uppercase">
        — Master
      </p>
    </div>
  );
}
