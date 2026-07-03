/**
 * カウンター店内 counter-back / 録音 back-record 共通の暗化レイヤー
 * （マスター・ランタン・counter-front・counter-record にはかからない）
 *
 * COUNTER_BACK_DARKEN_OPACITY       均一な黒（0=オフ）— 現在 0.55
 * COUNTER_BACK_DARKEN_TOP_GRADIENT  上部グラデ（0=オフ）— 現在 0.2
 */

/** 均一な黒オーバーレイの不透明度（0=オフ, 0.35=試し値） */
export const COUNTER_BACK_DARKEN_OPACITY = 0.65;

/** 上部をやや暗くするグラデーションの不透明度（0=オフ） */
export const COUNTER_BACK_DARKEN_TOP_GRADIENT = 0.2;
