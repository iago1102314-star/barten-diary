/** 録音終了〜日記保存までの計測（ms） */
export type NightPipelineTimings = {
  recordingCheckMs: number;
  whisperMs: number;
  readinessMs: number;
  diaryGenerationMs: number;
  totalMs: number;
  /** 店内別れシーン終了時点で日記生成が完了していたか */
  generationCompleteAtStoreEnding: boolean | null;
  /** 路地で composing 表示していた時間（未待機なら 0） */
  alleyWaitMs: number;
};

export const EMPTY_NIGHT_PIPELINE_TIMINGS: NightPipelineTimings = {
  recordingCheckMs: 0,
  whisperMs: 0,
  readinessMs: 0,
  diaryGenerationMs: 0,
  totalMs: 0,
  generationCompleteAtStoreEnding: null,
  alleyWaitMs: 0,
};
