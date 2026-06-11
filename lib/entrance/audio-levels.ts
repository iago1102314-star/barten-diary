/**
 * バー音声の音量・タイミング調整用パラメータ。
 * 0.0〜1.0（HTMLAudioElement.volume）
 */
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
  /** 入店時の outside フェードアウト */
  outsideStopFadeMs: 2000,
  /** 店内ジャズの入店時フェードイン */
  jazzEntryFadeMs: 5000,
  fadeStepMs: 50,
  /** 曲内ランダム開始の分割数 */
  randomStartSegments: 5,
  /** 入店暗転完了から扉 SE まで（ms） */
  doorDelayAfterEntryFadeMs: 400,
  /** 扉 SE 再生から吹き出し表示まで（ms） */
  masterBubbleDelayAfterDoorMs: 1400,
  /** グラススライド SE の遅延（drinkServed から） */
  glassSlideDelayMs: 900,
  /** カウンター明転のフェード（ms） */
  counterRevealFadeMs: 3600,
  /** カウンター明転フェード開始前の待ち（ms） */
  counterRevealFadeDelayMs: 150,
  /** 明転完了から「今日はどうしようか？」まで（ms） */
  moodPromptDelayAfterRevealMs: 0,
} as const;
