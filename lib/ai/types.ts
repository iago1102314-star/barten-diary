export type GeneratedDiaryContent = {
  diary: string;
  drinkNote: string;
  masterComment: string;
};

export type GeneratedDiary = GeneratedDiaryContent & {
  bottleTag: string;
};

export type GenerateDiaryError = {
  error: string;
};

export type GeneratedDiaryVariant = GeneratedDiary & {
  temperature: number;
  label: string;
  /** ラボ用: 後処理で行った調整のメモ */
  postProcessAdjustments?: string[];
};

export type GenerateDiaryVariantsResult = {
  variants: GeneratedDiaryVariant[];
};

export type DiaryDrinkContext = {
  selectedCategoryId: string;
  selectedCategoryLabel: string;
  selectedDrinkId: string;
  selectedDrinkName: string;
};
