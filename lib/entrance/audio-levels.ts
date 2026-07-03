/**
 * バー音声のタイミング調整用パラメータ（音量は audio-volume-tuning.ts）
 */
import { JAZZ_BGM_AMBIENT_TUNING } from "@/lib/entrance/audio-volume-tuning";
import {
  DOOR_EXIT_DURATION_SEC,
  START_ENTRY_OUTSIDE_FADE_MS,
} from "@/lib/entrance/start-entry-timing";

export {
  AUDIO_VOLUME_TUNING,
  BAR_AUDIO_LEVELS,
  clearAudioVolumeOverrides,
  getBgmMix,
  getSeMix,
  getSfxPlayVolume,
  getSfxSceneVolumeScale,
  installAudioVolumeDevApi,
  isAudioVolumeDebugEnabled,
  isAudioVolumeTunePanelEnabled,
  JAZZ_BGM_AMBIENT_TUNING,
  logAudioVolumeDebug,
  readAudioVolumeOverrides,
  readBarAudioLevels,
  saveAudioVolumeOverrides,
  type AudioVolumeOverrides,
  type BarSfxKind,
  type BgmMixKey,
} from "@/lib/entrance/audio-volume-tuning";

export const BAR_AUDIO_TIMING = {
  /** BGM フェードイン・アウト（通常） */
  fadeMs: 1600,
  /** 録音開始直前 — 店内 BGM をフェードアウトしてから完全停止 */
  recordingFadeOutMs: 300,
  /** 入店時の outside フェードアウト */
  outsideStopFadeMs: 2000,
  /** 扉を開ける — outside を暗転に合わせて下げる */
  doorExitOutsideFadeMs: Math.round(DOOR_EXIT_DURATION_SEC * 1000),
  /** ホーム入場 — 路地 BGM を 0 からタイトル表示まで（start-entry-timing と同期） */
  entryOutsideFadeMs: START_ENTRY_OUTSIDE_FADE_MS,
  /** 店内ジャズの入店時フェードイン */
  jazzEntryFadeMs: 5000,
  fadeStepMs: 50,
  /** 曲内ランダム開始の分割数 */
  randomStartSegments: 5,
  /** 入店暗転完了から扉 SE まで（ms） */
  doorDelayAfterEntryFadeMs: 300,
  /** 黒画面マウントから吹き出し表示まで（ms） */
  masterBubbleDelayAfterDoorMs: 2100,
  /** グラススライド SE の遅延（drinkServed から） */
  glassSlideDelayMs: 900,
  /** カウンター明転のフェード（ms）— 遅延込みで約 2 秒 */
  counterRevealFadeMs: 1900,
  /** カウンター明転フェード開始前の待ち（ms） */
  counterRevealFadeDelayMs: 100,
  /** 明転完了から「今日はどうしようか？」まで（ms） */
  moodPromptDelayAfterRevealMs: 0,
  /** 店内ジャズ — 弱い呼吸（A）+ ループ継ぎ目フェード（B） */
  jazzAmbient: JAZZ_BGM_AMBIENT_TUNING,
} as const;
