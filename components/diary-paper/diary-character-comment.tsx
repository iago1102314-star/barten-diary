import styles from "@/components/diary-paper/diary-paper.module.css";
import {
  DEFAULT_DIARY_PAPER_CHARACTER_ID,
  getDiaryPaperCharacterVoice,
} from "@/lib/diary-paper/diary-paper-characters";
import type { DiaryPaperCharacterId } from "@/lib/diary-paper/diary-paper-characters";

type DiaryCharacterCommentProps = {
  characterId?: DiaryPaperCharacterId;
  comment: string;
  signature?: string;
};

function splitCharacterSignature(signature: string): {
  dash: string;
  name: string;
} {
  const trimmed = signature.trim();
  const match = trimmed.match(/^(—)\s*(.+)$/);

  if (match) {
    return { dash: match[1]!, name: match[2]!.trim() };
  }

  return { dash: "—", name: trimmed.replace(/^—\s*/, "") || "Master" };
}

export function DiaryCharacterComment({
  characterId = DEFAULT_DIARY_PAPER_CHARACTER_ID,
  comment,
  signature,
}: DiaryCharacterCommentProps) {
  const voice = getDiaryPaperCharacterVoice(characterId);
  const resolvedSignature = signature ?? voice.defaultSignature;
  const { dash, name } = splitCharacterSignature(resolvedSignature);

  return (
    <aside
      className={styles.characterFrame}
      data-character={characterId}
      aria-label={`${characterId}の言葉`}
    >
      <div className={styles.characterInner}>
        <p
          className={`${styles.paragraph} ${styles.characterCaption} ${voice.commentFontClassName}`}
        >
          {comment}
        </p>
      </div>
      {resolvedSignature ? (
        <p className={styles.characterSignature} aria-label={resolvedSignature}>
          <span className={styles.characterSignatureDash}>{dash}</span>{" "}
          <span
            className={`${voice.signatureFontClassName} ${styles.characterSignatureName}`}
          >
            {name}
          </span>
        </p>
      ) : null}
    </aside>
  );
}
