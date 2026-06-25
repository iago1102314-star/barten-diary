/** 録音終了〜日記保存までの計測（ms） */
export type NightPipelineTimings = {
  recordingCheckMs: number;
  whisperMs: number;
  readinessMs: number;
  diaryGenerationMs: number;
  saveMs: number;
  totalMs: number;
  /** 店内別れシーン終了時点で日記生成が完了していたか */
  generationCompleteAtStoreEnding: boolean | null;
  /** パイプライン開始〜店内エンディング終了（並列処理中の店内滞在時間） */
  waitingInStoreMs: number;
  /** 路地で「綴っています…」表示していた時間（未待機なら 0） */
  waitingInAlleyMs: number;
};

export const EMPTY_NIGHT_PIPELINE_TIMINGS: NightPipelineTimings = {
  recordingCheckMs: 0,
  whisperMs: 0,
  readinessMs: 0,
  diaryGenerationMs: 0,
  saveMs: 0,
  totalMs: 0,
  generationCompleteAtStoreEnding: null,
  waitingInStoreMs: 0,
  waitingInAlleyMs: 0,
};

export function sumPipelineProcessingMs(
  timings: Pick<
    NightPipelineTimings,
    | "recordingCheckMs"
    | "whisperMs"
    | "readinessMs"
    | "diaryGenerationMs"
    | "saveMs"
  >,
): number {
  return (
    timings.recordingCheckMs +
    timings.whisperMs +
    timings.readinessMs +
    timings.diaryGenerationMs +
    timings.saveMs
  );
}
