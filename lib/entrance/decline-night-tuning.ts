/**
 * 「また今度にする」— 暗転・負荷対策のタイミング。
 */

import { MEMORIES_RETURN_FADE_OUT_SEC } from "@/lib/entrance/start-entry-timing";

export const DECLINE_NIGHT_TUNING = {
  /** カウンター＋UI を保ったまま画面を暗くする時間（ms） */
  fadeMs: 800,
  /**
   * 暗転完了後 — 重いレイヤーを外してからセリフ画面へ（ms）。
   * 0 でも可。1 フレーム分以上あると GPU 解放が安定しやすい。
   */
  blackoutHoldMs: 64,
  /** 暗転オーバーレイ — パララックス・ビネット・UI より上 */
  overlayZIndex: 60,
  /** 別れセリフ後 — ホームへ切り替える前の暗転（秒） */
  returnFadeOutSec: MEMORIES_RETURN_FADE_OUT_SEC,
} as const;
