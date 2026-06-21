export type MemoriesBackdrop = "entry" | "afterNight";

export type MemoriesLaunch = {
  backdrop: MemoriesBackdrop;
  initialDiaryId?: string;
  /** onBack で戻る先 */
  returnTo: "entry" | "alley";
};

export const DEFAULT_MEMORIES_LAUNCH: MemoriesLaunch = {
  backdrop: "entry",
  returnTo: "entry",
};
