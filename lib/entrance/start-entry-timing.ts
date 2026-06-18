/** ホーム入場演出 — タイミング（BGM・UI と同期） */
export const START_ENTRY_BOKEH_HOLD_MS = 210;
export const START_ENTRY_REVEAL_MS = 1680;
/** normal 到達後、タイトル表示までの delay（night-entry-screen と一致） */
export const START_ENTRY_TITLE_DELAY_MS = 200;
/** normal 到達後、ボタン表示までの delay */
export const START_ENTRY_BUTTONS_DELAY_MS = 900;

/** 路地 BGM — 0 からタイトル表示までフェードイン */
export const START_ENTRY_OUTSIDE_FADE_MS =
  START_ENTRY_BOKEH_HOLD_MS +
  START_ENTRY_REVEAL_MS +
  START_ENTRY_TITLE_DELAY_MS;

/** 扉を開ける — 75% 50% へズームしながらフェードアウト */
export const DOOR_EXIT_DURATION_SEC = 0.945;
export const DOOR_EXIT_ORIGIN_X_PERCENT = 75;
export const DOOR_EXIT_ORIGIN_Y_PERCENT = 40;
export const DOOR_EXIT_ORIGIN = `${DOOR_EXIT_ORIGIN_X_PERCENT}% ${DOOR_EXIT_ORIGIN_Y_PERCENT}%`;
/** ズーム中心の確認用赤点 */
export const SHOW_DOOR_EXIT_ORIGIN_MARKER = false;
/** 拡大量を 1 からの差分 ×0.7（旧 1.11 → 1.077、旧 1.015 → 1.0105） */
export const DOOR_EXIT_ZOOM_SCALE = 1.077;
export const DOOR_EXIT_IMAGE_ZOOM_SCALE = 1.0105;

/** ホーム → メモ — 暗転（メモ画面フェードイン開始まで） */
export const MEMORIES_EXIT_FADE_SEC = 0.63;
/** メモ画面 — 背景・UI の明転 */
export const MEMORIES_BG_FADE_IN_SEC = 1.4;
/** メモ → ホーム — 暗転 */
export const MEMORIES_RETURN_FADE_OUT_SEC = 0.5;
/** メモ → ホーム（定常）— 背景・UI の明転（メモ画面と同じ） */
export const STEADY_HOME_FADE_IN_SEC = MEMORIES_BG_FADE_IN_SEC;
