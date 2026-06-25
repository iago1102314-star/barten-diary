import { detectInjectionInTranscript } from "@/lib/ai/security/detect-injection";
import { validateOutputSecurity } from "@/lib/ai/security/validate-output";
import { evaluateTranscriptForGeneration } from "@/lib/night/transcript-generation-boundary";
import { buildQuietnessReport } from "@/lib/ai/quality/quality-report";
import type { GeneratedDiary } from "@/lib/ai/types";

export type InputSecurityReport = {
  inputOk: boolean;
  inputMessage: string | null;
  injectionHits: ReturnType<typeof detectInjectionInTranscript>;
  warnings: string[];
  /** 境界拒否（フィラーのみ等）— インジェクション疑いとは別 */
  boundaryWarnings: string[];
  /** インジェクション疑い — 生成はブロックしない */
  injectionWarnings: string[];
};

export type OutputSecurityReport = {
  warnings: string[];
};

export function buildInputSecurityReport(transcript: string): InputSecurityReport {
  const validation = evaluateTranscriptForGeneration(transcript);
  const injectionHits = detectInjectionInTranscript(transcript);
  const boundaryWarnings: string[] = [];
  const injectionWarnings: string[] = [];

  if (!validation.ok) {
    boundaryWarnings.push(`境界: ${validation.message}`);
  }

  for (const hit of injectionHits) {
    injectionWarnings.push(
      `インジェクション疑い: ${hit.pattern.label}（「${hit.excerpt}」）— 発話として日記化`,
    );
  }

  return {
    inputOk: validation.ok,
    inputMessage: validation.ok ? null : validation.message,
    injectionHits,
    warnings: [...boundaryWarnings, ...injectionWarnings],
    boundaryWarnings,
    injectionWarnings,
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
