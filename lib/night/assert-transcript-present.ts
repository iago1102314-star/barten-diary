import { validateTranscriptInput } from "@/lib/ai/security/validate-input";

/** 日記生成へ渡す前のチェック — 空・フィラーのみ・無意味な文字列を拒否 */
export function assertTranscriptPresentForGeneration(transcript: string): void {
  const result = validateTranscriptInput(transcript);
  if (!result.ok) {
    throw new Error(result.message);
  }
}
