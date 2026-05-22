import { buildOutputSecurityReport } from "@/lib/ai/security/security-report";
import type { GeneratedDiary } from "@/lib/ai/types";

type QualityWarningsProps = {
  record: GeneratedDiary;
  transcript?: string;
  postProcessAdjustments?: string[];
};

export function QualityWarnings({
  record,
  transcript,
  postProcessAdjustments,
}: QualityWarningsProps) {
  const report = buildOutputSecurityReport(record, transcript);
  const hasWarnings =
    report.warnings.length > 0 ||
    (postProcessAdjustments && postProcessAdjustments.length > 0);

  if (!hasWarnings) {
    return (
      <p className="text-[11px] text-stone-600">
        空気・セキュリティ: 問題なし
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-amber-900/30 bg-amber-950/20 px-3 py-2">
      <p className="text-[11px] tracking-wide text-amber-200/70 uppercase">
        空気・セキュリティ
      </p>
      <ul className="space-y-1 text-xs text-amber-100/80">
        {report.warnings.map((warning) => (
          <li key={warning}>⚠ {warning}</li>
        ))}
        {postProcessAdjustments?.map((note) => (
          <li key={note} className="text-stone-500">
            後処理: {note}
          </li>
        ))}
      </ul>
    </div>
  );
}
