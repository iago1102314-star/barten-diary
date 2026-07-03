import type { DiaryPaperData } from "@/lib/diary-paper/diary-paper-types";

export type NightAlleyOutcome =
  | { kind: "composing"; startedAt: number }
  | { kind: "saved"; diaryId: string; paper: DiaryPaperData }
  | { kind: "devSaved" }
  | { kind: "needsLogin"; paper: DiaryPaperData }
  | { kind: "saveFailed" }
  | { kind: "unsaved" };

export type BackgroundWorkState =
  | "idle"
  | "pending"
  | "saved"
  | "devSaved"
  | "failed";
