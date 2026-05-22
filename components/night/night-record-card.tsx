import { DrinkIllustration } from "@/components/night/drink-illustration";
import { ShelfDivider } from "@/components/night/shelf-divider";
import { ShelfWineNote } from "@/components/night/shelf-wine-note";
import { stripTrailingEllipsis } from "@/lib/ai/quality/strip-trailing-ellipsis";
import type { GeneratedDiary } from "@/lib/ai/types";
import { toShelfBottleDisplay } from "@/lib/night/shelf-bottle-display";

type NightRecordCardProps = {
  record: GeneratedDiary;
};

export function NightRecordCard({ record }: NightRecordCardProps) {
  const shelf = toShelfBottleDisplay({
    ...record,
    diary: stripTrailingEllipsis(record.diary),
  });

  return (
    <article className="night-glow rounded-xl border border-stone-800/50 bg-stone-950/40 px-6 py-10 sm:px-8 sm:py-12">
      <header className="text-left">
        <p className="font-mono text-[13px] tracking-[0.12em] text-amber-200/75">
          {shelf.bottleTag}
        </p>
      </header>

      <div className="mt-10 text-left">
        <p className="whitespace-pre-wrap text-[15px] leading-[2.1] tracking-[0.02em] text-stone-200/88">
          {shelf.diary}
        </p>
      </div>

      <div className="mt-12">
        <ShelfDivider />
      </div>

      <footer className="mt-10 flex flex-col items-center gap-4 pb-2">
        <DrinkIllustration drinkName={shelf.drinkName} />

        <p className="font-mono text-xs tracking-[0.22em] text-stone-400/90">
          {shelf.drinkName}
        </p>

        {shelf.shelfWineNote && <ShelfWineNote text={shelf.shelfWineNote} />}
      </footer>
    </article>
  );
}
