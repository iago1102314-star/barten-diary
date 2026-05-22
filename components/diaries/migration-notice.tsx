type MigrationNoticeProps = {
  variant: "drink_note";
};

const DRINK_NOTE_SQL = `alter table public.diaries
  add column if not exists drink_note text;`;

export function MigrationNotice({ variant }: MigrationNoticeProps) {
  if (variant !== "drink_note") return null;

  return (
    <div
      role="status"
      className="mt-8 rounded-xl border border-amber-900/40 bg-amber-950/25 px-4 py-3 text-left text-sm leading-relaxed text-amber-100/80"
    >
      <p className="font-medium text-amber-200/90">酒の余韻用のDB設定が未完了です</p>
      <p className="mt-2 text-xs text-stone-400">
        Supabase の SQL Editor で次を実行してください（1回だけ）。
      </p>
      <pre className="mt-3 overflow-x-auto rounded-lg border border-stone-800 bg-stone-950/80 p-3 font-mono text-[11px] text-stone-400">
        {DRINK_NOTE_SQL}
      </pre>
    </div>
  );
}
