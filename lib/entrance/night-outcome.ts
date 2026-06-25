export type NightAlleyOutcome =
  | { kind: "composing"; startedAt: number }
  | { kind: "saved"; diaryId: string }
  | { kind: "devSaved" }
  | { kind: "saveFailed" }
  | { kind: "unsaved" };

export type BackgroundWorkState =
  | "idle"
  | "pending"
  | "saved"
  | "devSaved"
  | "failed";
