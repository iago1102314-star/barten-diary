"use client";

import { buildInputSecurityReport } from "@/lib/ai/security/security-report";

type InputSecurityPanelProps = {
  transcript: string;
};

export function InputSecurityPanel({ transcript }: InputSecurityPanelProps) {
  const report = buildInputSecurityReport(transcript);

  if (report.warnings.length === 0) {
    return (
      <p className="text-[11px] text-stone-600">
        入力チェック: 問題なし（{transcript.trim().length}字）
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {report.boundaryWarnings.length > 0 ? (
        <div className="rounded-lg border border-red-900/30 bg-red-950/20 px-3 py-2">
          <p className="text-[11px] tracking-wide uppercase text-red-200/70">
            境界（生成しない）
          </p>
          <ul className="mt-1 space-y-1 text-xs text-stone-400">
            {report.boundaryWarnings.map((warning) => (
              <li key={warning}>✕ {warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {report.injectionWarnings.length > 0 ? (
        <div className="rounded-lg border border-stone-700/50 bg-stone-950/40 px-3 py-2">
          <p className="text-[11px] tracking-wide uppercase text-stone-500">
            インジェクション疑い（生成は続行）
          </p>
          <ul className="mt-1 space-y-1 text-xs text-stone-400">
            {report.injectionWarnings.map((warning) => (
              <li key={warning}>◇ {warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
