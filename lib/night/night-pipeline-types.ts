import type { GeneratedDiary } from "@/lib/ai/types";

export type NightSavePayload = {
  bottleTag: string;
  diary: GeneratedDiary["diary"];
  drinkNote: string;
  masterComment: string;
  transcript: string;
  continuedFromDiaryId: string | null;
  continuedFromBottleTag: string | null;
};

export type NightSaveStatus = "idle" | "pending" | "saving" | "saved" | "failed";

export type NightPipelineFailurePhase =
  | "transcribe"
  | "readiness"
  | "generation"
  | "save";
