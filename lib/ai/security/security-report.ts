import { detectInjectionInTranscript } from "@/lib/ai/security/detect-injection";
import { validateOutputSecurity } from "@/lib/ai/security/validate-output";
import { validateTranscriptInput } from "@/lib/ai/security/validate-input";
import { buildQuietnessReport } from "@/lib/ai/quality/quality-report";
import type { GeneratedDiary } from "@/lib/ai/types";

export type InputSecurityReport = {
  inputOk: boolean;
  inputMessage: string | null;
  injectionHits: ReturnType<typeof detectInjectionInTranscript>;
  warnings: string[];
};

export type OutputSecurityReport = {
  warnings: string[];
};

export function buildInputSecurityReport(transcript: string): InputSecurityReport {
  const validation = validateTranscriptInput(transcript);
  const injectionHits = detectInjectionInTranscript(transcript);
  const warnings: string[] = [];

  if (!validation.ok) {
    warnings.push(`入力: ${validation.message}`);
  }

  for (const hit of injectionHits) {
    warnings.push(
      `インジェクション疑い: ${hit.pattern.label}（「${hit.excerpt}」）— 発話として扱う`,
    );
  }

  return {
    inputOk: validation.ok,
    inputMessage: validation.ok ? null : validation.message,
    injectionHits,
    warnings,
  };
}

export function buildOutputSecurityReport(
  record: GeneratedDiary,
  transcript?: string,
): OutputSecurityReport {
  const security = validateOutputSecurity(record);
  const quietness = buildQuietnessReport(record, transcript);

  return {
    warnings: [...security, ...quietness.warnings],
  };
}
