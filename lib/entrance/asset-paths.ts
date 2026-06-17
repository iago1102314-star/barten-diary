/** 導入フロー用アセットパス（public/assets/） */
export const ENTRANCE_ASSETS = {
  /** 入店前 — 雨の路地（入口） */
  start: "/assets/start/rain-alley.webp",
  /** 見送り後 — 夜が終わった帰り道 */
  afterNight: "/assets/alley/after-night.webp",
  counterBack: "/assets/bar/counter-back.webp",
  counterFront: "/assets/bar/counter-front.webp",
  lantern: "/assets/bar/lantern.webp",
  masterIdle: "/assets/master/master-idle.webp",
  leaving: "/assets/bar/leaving.webp",
  past: "/assets/bar/past.webp",
  pastHover: "/assets/bar/past_hover.webp",
  back: "/back.svg",
} as const;

export const ENTRANCE_SOUNDS = {
  /** 路地・帰り道の遠い環境音 */
  outside: "/sounds/outside.mp3",
  /** 扉を開ける */
  door: "/sounds/door.mp4",
  /** 店内ジャズ */
  jazz: "/sounds/jazz.mp3",
  /** グラスをカウンター手前へスライド */
  glassSlide: "/sounds/grass.mp4",
  /** 吹き出しタップ */
  click: "/sounds/click.mp4",
  /** 気分選択の幕 */
  think: "/sounds/think.mp4",
} as const;
