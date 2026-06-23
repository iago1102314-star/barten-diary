import { cineCaption, parisienne } from "@/lib/diary-paper/diary-paper-font";

/** 日記紙に載せるキャラクター ID（増やすときはここに追加） */
export type DiaryPaperCharacterId = "master";

export type DiaryPaperCharacterVoice = {
  id: DiaryPaperCharacterId;
  defaultSignature: string;
  commentFontClassName: string;
  signatureFontClassName: string;
};

/**
 * キャラクターごとの「言葉・署名」フォント。
 * 色や枠線は CSS の `[data-character="…"]` で差別化する。
 */
export const DIARY_PAPER_CHARACTER_VOICES: Record<
  DiaryPaperCharacterId,
  DiaryPaperCharacterVoice
> = {
  master: {
    id: "master",
    defaultSignature: "— Master",
    commentFontClassName: cineCaption.className,
    signatureFontClassName: parisienne.className,
  },
};

export const DEFAULT_DIARY_PAPER_CHARACTER_ID: DiaryPaperCharacterId = "master";

export function getDiaryPaperCharacterVoice(
  characterId: DiaryPaperCharacterId = DEFAULT_DIARY_PAPER_CHARACTER_ID,
): DiaryPaperCharacterVoice {
  return DIARY_PAPER_CHARACTER_VOICES[characterId];
}
