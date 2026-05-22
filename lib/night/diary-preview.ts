/** 棚一覧用 — 末尾に … を付けないプレビュー */
export const SHELF_DIARY_PREVIEW_CHARS = 140;

export type DiaryPreview = {
  text: string;
  isTruncated: boolean;
};

export function buildDiaryPreview(
  diary: string,
  max = SHELF_DIARY_PREVIEW_CHARS,
): DiaryPreview {
  const trimmed = diary.trim();
  if (trimmed.length <= max) {
    return { text: trimmed, isTruncated: false };
  }

  const cut = trimmed.slice(0, max).replace(/\n+$/, "").trimEnd();
  return { text: cut, isTruncated: true };
}
