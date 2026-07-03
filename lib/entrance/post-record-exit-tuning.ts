/** 録音終了〜退店 — 暗転・マスター別れ・路地へ */
export const POST_RECORD_EXIT_TUNING = {
  /** 録音チェック中の暗幕 — 暖色ではなく真っ黒 */
  softBlackColor: "#000000",
  softBlackFadeInMs: 640,
  /**
   * 別れセリフ後 — カウンターを引いていく時間（秒）。
   * 画面中央を軸に scale 1 → pullBackScale へ縮小しながらフェードアウト。
   */
  storeExitDurationSec: 2.2,
  storeExitOrigin: "50% 50%",
  storeExitPullBackScale: 0.94,
  /** 入店時 door 音量の倍率 */
  doorVolumeScale: 0.5,
  /** 別れセリフ後 — 店内 jazz を下げ切るまで */
  jazzFadeOutMs: 600,
  /** 引き演出完了から扉 SE まで（ms） */
  doorDelayAfterStoreExitMs: 0,
  /** 扉 SE 後 — 路地へ切り替えるまで */
  afterDoorHoldMs: 420,
  /** 退店後 outside のフェードイン */
  outsideFadeInMs: 2800,
  masterThanksLines: ["話してくれてありがとう。", "気をつけて帰れよ。"],
} as const;
