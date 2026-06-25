import {
  validateTranscriptInput,
  type TranscriptValidationCode,
  type TranscriptValidationResult,
} from "@/lib/ai/security/validate-input";
import { isFillerOnlyTranscript } from "@/lib/ai/speech-fillers";

export type { TranscriptValidationCode, TranscriptValidationResult };

/**
 * 日記生成の境界チェック。
 * - フィラーのみ → 生成しない（聞き取れなかった）
 * - プロンプトインジェクション疑い → ここでは判定しない（通常どおり生成）
 */
export function evaluateTranscriptForGeneration(
  transcript: string,
): TranscriptValidationResult {
  return validateTranscriptInput(transcript);
}

export function assertTranscriptAllowedForGeneration(transcript: string): void {
  const result = evaluateTranscriptForGeneration(transcript);
  if (!result.ok) {
    throw new Error(result.message);
  }
}

export { isFillerOnlyTranscript };
