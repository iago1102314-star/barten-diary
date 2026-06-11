/**
 * 気分選択前後のネイビー幕
 */
export const MOOD_CURTAIN = {
  /** 幕本体のネイビー */
  fabric: "rgba(18, 17, 22, 0.78)",
  fabricSoft: "rgba(36, 35, 43, 0.42)",
  /** 上から下ろす時間（秒・等速） */
  dropDurationSec: 1,
  /** 幕がこの割合まで下りたら選択 UI を出す */
  uiRevealAtDropRatio: 0.25,
  /** 選択確定後に幕を下ろす時間（秒） */
  closeDurationSec: 1,
} as const;
