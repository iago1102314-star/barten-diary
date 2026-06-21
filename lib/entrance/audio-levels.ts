/**
 * バー音声の音量・タイミング調整用パラメータ。
 * 0.0〜1.0 — BGM はそのまま。SE sfx.* はミックス（getSfxPlayVolume でピーク補正）
 */
import {
  DOOR_EXIT_DURATION_SEC,
  START_ENTRY_OUTSIDE_FADE_MS,
} from "@/lib/entrance/start-entry-timing";

export const BAR_AUDIO_LEVELS = {
  /** 路地・帰り道の環境音（ループ） */
  outside: {
    /** entry / memories */
    alley: 0.27,
    /** 退店後の路地 */
    leaving: 0.15,
  },
  /** 店内ジャズ（ループ） */
  jazz: {
    counter: 0.018,
  },
  /** 一度きりの効果音 — ミックス（0–1）。同じ SE 内なら 2 倍で約 2 倍の音量 */
  sfx: {
    door: 0.15,
    glassSlide: 0.48,
    send: 0.35,
    click: 0.3,
    think: 0.6,
  },
} as const;

export type BarSfxKind = keyof typeof BAR_AUDIO_LEVELS.sfx;

/**
 * 音源 max_volume dBFS（ffmpeg volumedetect）。
 * door.mp4 は 0 dB ピークのため mix だけでは効きが弱い — ここで補正する。
 */
const SFX_PEAK_DBFS: Record<BarSfxKind, number> = {
  door: 0,
  glassSlide: -0.2,
  send: -6,
  click: -5.9,
  think: -15.5,
};

/** mix 1.0 ≒ 同程度のラウドネス（-6 dBFS 基準） */
const SFX_REFERENCE_PEAK_LINEAR = 10 ** (-6 / 20);

/** 再生直前に呼ぶ — BAR_AUDIO_LEVELS.sfx[kind] をピーク補正して 0–1 に変換 */
export function getSfxPlayVolume(kind: BarSfxKind): number {
  const mix = BAR_AUDIO_LEVELS.sfx[kind];
  const peakLinear = 10 ** (SFX_PEAK_DBFS[kind] / 20);
  return Math.max(0, Math.min(1, mix * (SFX_REFERENCE_PEAK_LINEAR / peakLinear)));
}

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
