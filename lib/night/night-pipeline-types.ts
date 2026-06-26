import type { GeneratedDiary } from "@/lib/ai/types";

export type NightSavePayload = {
  bottleTag: string;
  diary: GeneratedDiary["diary"];
  drinkNote: string;
  masterComment: string;
  transcript: string;
  continuedFromDiaryId: string | null;
  continuedFromBottleTag: string | null;
  /** ゲスト引き継ぎ — 元の生成時刻を DB に反映 */
  createdAt?: string;
};

export type NightSaveStatus =
  | "idle"
  | "pending"
  | "saving"
  | "saved"
  | "failed"
  | "loginRequired";

export type NightPipelineFailurePhase =
  | "transcribe"
  | "readiness"
  | "generation"
  | "save";
