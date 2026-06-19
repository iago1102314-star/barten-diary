/**
 * バー音声の音量・タイミング調整用パラメータ。
 * 0.0〜1.0（HTMLAudioElement.volume）
 */
import { START_ENTRY_OUTSIDE_FADE_MS } from "@/lib/entrance/start-entry-timing";

export const BAR_AUDIO_LEVELS = {
  /** 路地・帰り道の環境音（ループ） */
  outside: {
    /** entry / memories */
    alley: 1,
    /** 退店後の路地 */
    leaving: 0.54,
  },
  /** 店内ジャズ（ループ） */
  jazz: {
    counter: 0.03,
  },
  /** 一度きりの効果音 */
  sfx: {
    door: 0.13,
    glassSlide: 0.59,
    click: 0.67,
    think: 0.67,
  },
} as const;

export const BAR_AUDIO_TIMING = {
  /** BGM フェードイン・アウト（通常） */
  fadeMs: 1600,
  /** 録音開始直前 — 店内 BGM をフェードアウトしてから完全停止 */
  recordingFadeOutMs: 300,
  /** 入店時の outside フェードアウト */
  outsideStopFadeMs: 2000,
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
  /** カウンター明転のフェード（ms） */
  counterRevealFadeMs: 3600,
  /** カウンター明転フェード開始前の待ち（ms） */
  counterRevealFadeDelayMs: 150,
  /** 明転完了から「今日はどうしようか？」まで（ms） */
  moodPromptDelayAfterRevealMs: 0,
  /**
   * 店内ジャズ — 弱い呼吸（A）+ ループ継ぎ目フェード（B）
   * multiplier は targetVolume に掛ける係数（0〜1）
   */
  jazzAmbient: {
    /** 1ループあたりの呼吸回数 */
    breathCyclesPerLoop: 3,
    /** 呼吸の深さ（0.35 = 通常の65%まで下がる） */
    breathDepth: 0.35,
    /** ループ直前フェードアウト（秒） */
    loopFadeOutSec: 1.2,
    /** ループ直後フェードイン（秒） */
    loopFadeInSec: 2,
    /** ループ継ぎ目の最低音量（通常比） */
    loopFloorRatio: 0.3,
  },
} as const;
