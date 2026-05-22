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
    <div
      className={`space-y-2 rounded-lg border px-3 py-2 ${
        report.inputOk
          ? "border-stone-700/50 bg-stone-950/40"
          : "border-red-900/30 bg-red-950/20"
      }`}
    >
      <p
        className={`text-[11px] tracking-wide uppercase ${
          report.inputOk ? "text-stone-500" : "text-red-200/70"
        }`}
      >
        入力チェック
      </p>
      <ul className="space-y-1 text-xs text-stone-400">
        {report.warnings.map((warning) => (
          <li key={warning}>
            {report.inputOk ? "◇" : "✕"} {warning}
          </li>
        ))}
      </ul>
    </div>
  );
}
