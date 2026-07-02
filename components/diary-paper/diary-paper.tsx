"use client";

import { DiaryBody } from "@/components/diary-paper/diary-body";
import {
  DiaryBodyEditor,
  type DiaryBodyEditorProps,
} from "@/components/diary-paper/diary-body-editor";
import { DiaryDrink } from "@/components/diary-paper/diary-drink";
import { DiaryHeader } from "@/components/diary-paper/diary-header";
import { DiaryCharacterComment } from "@/components/diary-paper/diary-character-comment";
import styles from "@/components/diary-paper/diary-paper.module.css";
import { zenKurenaido } from "@/lib/diary-paper/diary-paper-font";
import { DIARY_PAPER_LAYOUT } from "@/lib/diary-paper/diary-paper-layout";
import { resolveDiaryDrinkVisuals } from "@/lib/diary-paper/resolve-diary-drink-visuals";
import type { DiaryPaperData } from "@/lib/diary-paper/diary-paper-types";
import { useRef, type CSSProperties, type ReactNode } from "react";

type DiaryPaperProps = {
  data: DiaryPaperData;
  className?: string;
  bodyEdit?: DiaryBodyEditorProps;
  /** 詳細画面のみ — マスターコメント下まで罫線付きで画面高に伸ばす（共有画像には含めない） */
  stretchToViewport?: boolean;
};

const paperLayoutStyle = {
  "--diary-date-rows": DIARY_PAPER_LAYOUT.dateRows,
  "--diary-drink-block-rows": DIARY_PAPER_LAYOUT.drinkBlockRows,
  "--diary-character-gap-rows": DIARY_PAPER_LAYOUT.characterGapRows,
} as CSSProperties;

function EditDimmedSection({
  dimmed,
  children,
}: {
  dimmed: boolean;
  children: ReactNode;
}) {
  if (!dimmed) return children;

  return <div className={styles.editDimmedInner}>{children}</div>;
}

export function DiaryPaper({
  data,
  className,
  bodyEdit,
  stretchToViewport = false,
}: DiaryPaperProps) {
  const bodyEditRef = useRef<HTMLDivElement>(null);
  const drinkVisuals =
    data.maskingTapeSrc != null && data.drinkPhotoTiltDeg != null
      ? {
          drinkImageSrc: data.drinkImageSrc ?? null,
          maskingTapeSrc: data.maskingTapeSrc,
          drinkPhotoTiltDeg: data.drinkPhotoTiltDeg,
        }
      : resolveDiaryDrinkVisuals(
          data.diaryVisualSeed ?? data.dateLine,
          data.drinkName,
        );

  return (
    <article
      className={[
        styles.paper,
        className,
        stretchToViewport ? styles.paperStretchViewport : null,
      ]
        .filter(Boolean)
        .join(" ")}
      style={paperLayoutStyle}
      aria-label="夜の記録"
    >
      <div className={styles.paperCorners} aria-hidden>
        <span className={styles.cornerTL} />
        <span className={styles.cornerTR} />
        <span className={styles.cornerBR} />
        <span className={styles.cornerBL} />
      </div>
      <div className={`${zenKurenaido.className} ${styles.paperContent}`}>
        <div className={`${styles.mainRuledSection} ${styles.ruledBlock}`}>
          <EditDimmedSection dimmed={Boolean(bodyEdit)}>
            <DiaryHeader
              dateLine={data.dateLine}
              handwritingClassName={zenKurenaido.className}
            />
            <div className={styles.drinkBlockZone}>
              <div className={styles.drinkPhotoWrap}>
                <DiaryDrink
                  imageSrc={drinkVisuals.drinkImageSrc}
                  alt={data.drinkAlt}
                  maskingTapeSrc={drinkVisuals.maskingTapeSrc}
                  photoTiltDeg={drinkVisuals.drinkPhotoTiltDeg}
                />
              </div>
              {data.drinkName ? (
                <p className={styles.drinkNameLine}>{data.drinkName}</p>
              ) : null}
            </div>
          </EditDimmedSection>
          {bodyEdit ? (
            <DiaryBodyEditor ref={bodyEditRef} {...bodyEdit} />
          ) : (
            <DiaryBody body={data.body} />
          )}
          <EditDimmedSection dimmed={Boolean(bodyEdit)}>
            <DiaryCharacterComment
              characterId={data.characterId}
              comment={data.characterComment}
              signature={data.characterSignature}
            />
          </EditDimmedSection>
          <div className={styles.screenRuledFill} aria-hidden />
        </div>
      </div>
    </article>
  );
}
