/** 導入フロー用アセット — 詳細は `lib/assets/public-paths.ts` */
export const ENTRANCE_ASSETS = {
  /** 入店前 — 雨の路地（入口） */
  start: "/assets/start/rain-alley.webp",
  /** 見送り後 — 夜が終わった帰り道 */
  afterNight: "/assets/alley/after-night.webp",
  counterBack: "/assets/bar/counter-back.webp",
  counterFront: "/assets/bar/counter-front.webp",
  /**
   * 録音シーン — 固定背景（全ドリンク共通）
   * back →（将来マスター）→ counter → グラス（`lib/drinks/drink-assets.ts` record）
   */
  backRecord: "/assets/bar/back-record.webp",
  counterRecord: "/assets/bar/counter-record.webp",
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
  /** 気分確定 — 選ばれたボタンが中央へ動き出す */
  send: "/sounds/send.mp4",
  /** 吹き出しタップ */
  click: "/sounds/click.mp4",
  /** 設定シートを開く */
  menuOpen: "/sounds/menu-open.mp4",
  /** 設定シート内の操作 */
  menuClick: "/sounds/menu-click.mp4",
  /** 夜のメモ — ページめくり */
  page: "/sounds/page.mp4",
  /** 気分選択の幕 */
  think: "/sounds/think.mp4",
} as const;
