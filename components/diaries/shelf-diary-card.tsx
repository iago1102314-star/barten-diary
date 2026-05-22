import { DrinkIllustration } from "@/components/night/drink-illustration";
import { ShelfDivider } from "@/components/night/shelf-divider";
import { ShelfWineNote } from "@/components/night/shelf-wine-note";
import { stripTrailingEllipsis } from "@/lib/ai/quality/strip-trailing-ellipsis";
import { buildDiaryPreview } from "@/lib/night/diary-preview";
import { toShelfBottleDisplay } from "@/lib/night/shelf-bottle-display";
import type { ShelfBottleFields } from "@/lib/night/shelf-bottle-display";
import Link from "next/link";

type ShelfDiaryCardProps = ShelfBottleFields & {
  id?: string;
  createdAt?: string;
  compact?: boolean;
};

export function ShelfDiaryCard({
  id,
  bottleTag,
  diary,
  drinkNote,
  masterComment,
  createdAt,
  compact = false,
}: ShelfDiaryCardProps) {
  const diaryText = stripTrailingEllipsis(diary);
  const preview = compact ? buildDiaryPreview(diaryText) : null;

  const shelf = toShelfBottleDisplay({
    bottleTag,
    diary: diaryText,
    drinkNote,
    masterComment,
  });

  const bodyText = preview ? preview.text : diaryText;
  const winePreview =
    compact && shelf.shelfWineNote
      ? shelf.shelfWineNote.replace(/\n/g, " ")
      : shelf.shelfWineNote;

  return (
    <article className="night-glow rounded-xl border border-stone-800/50 bg-stone-950/35 px-5 py-8 sm:px-6 sm:py-9">
      <header className="flex items-start justify-between gap-4">
        <p className="font-mono text-[12px] tracking-[0.1em] text-amber-200/70">
          {shelf.bottleTag}
        </p>
        {createdAt && (
          <time
            dateTime={createdAt}
            className="shrink-0 text-[10px] tabular-nums tracking-wide text-stone-700"
          >
            {formatShelfTime(createdAt)}
          </time>
        )}
      </header>

      <div className="mt-8 text-left">
        <p className="whitespace-pre-wrap text-[14px] leading-[2] tracking-[0.02em] text-stone-300/85">
          {bodyText}
        </p>
        {compact && preview?.isTruncated && id && (
          <p className="mt-4">
            <Link
              href={`/diaries/${id}`}
              className="text-[11px] tracking-[0.2em] text-stone-600 transition-colors hover:text-stone-400"
            >
              開く
            </Link>
          </p>
        )}
      </div>

      <div className="mt-8">
        <ShelfDivider />
      </div>

      <footer className="mt-6 flex flex-col items-center gap-3">
        <DrinkIllustration drinkName={shelf.drinkName} />

        <p className="font-mono text-[11px] tracking-[0.2em] text-stone-500/80">
          {shelf.drinkName}
        </p>

        {winePreview && <ShelfWineNote text={winePreview} />}
      </footer>
    </article>
  );
}

function formatShelfTime(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
