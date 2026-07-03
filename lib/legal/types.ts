/** 法的情報パネル用 — 見出し＋段落の1セクション */
export type LegalSection = {
  heading: string;
  paragraphs: readonly string[];
};

/** 利用規約・プライバシーポリシーなどの条文ドキュメント */
export type LegalDocument = {
  /** 表示用の最終更新日（例: 2026年7月3日） */
  lastUpdated: string;
  sections: readonly LegalSection[];
};
