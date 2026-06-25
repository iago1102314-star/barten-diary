export type NightAlleyOutcome =
  | { kind: "composing" }
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
