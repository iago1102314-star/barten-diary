import { MOOD_SELECT_BACKDROP_COLOR } from "@/lib/entrance/mood-vignette-tuning";

/** 録音終了〜退店 — 暗転・マスター別れ・路地へ */
export const POST_RECORD_EXIT_TUNING = {
  /** 溶解演出と同系 — 生成確認中の暗転 */
  softBlackColor: MOOD_SELECT_BACKDROP_COLOR,
  softBlackFadeInMs: 640,
  /** 別れタップ後 — 真っ黒 */
  pureBlackFadeInMs: 880,
  /** 入店時 door 音量の倍率 */
  doorVolumeScale: 0.5,
  /** 扉 SE 後 — after-night へ切り替えるまで */
  afterDoorHoldMs: 400,
  masterThanksLines: ["話してくれてありがとう。", "気をつけて帰れよ"],
} as const;
