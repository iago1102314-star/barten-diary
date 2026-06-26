/** saveAiDiary — 未ログイン時の返却コード（redirect しない） */
export const SAVE_AI_DIARY_NEEDS_LOGIN = "NEEDS_LOGIN" as const;

export function isSaveAiDiaryNeedsLogin(
  error: string | undefined,
): boolean {
  return error === SAVE_AI_DIARY_NEEDS_LOGIN;
}
