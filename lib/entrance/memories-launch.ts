export type MemoriesBackdrop = "entry" | "afterNight";

export type MemoriesLaunch = {
  backdrop: MemoriesBackdrop;
  initialDiaryId?: string;
};

export const DEFAULT_MEMORIES_LAUNCH: MemoriesLaunch = {
  backdrop: "entry",
};
