import { DiaryDateLine } from "@/components/diary-paper/diary-date-line";
import styles from "@/components/diary-paper/diary-paper.module.css";

type DiaryHeaderProps = {
  dateLine: string;
  handwritingClassName: string;
};

export function DiaryHeader({
  dateLine,
  handwritingClassName,
}: DiaryHeaderProps) {
  return (
    <header className={`${styles.header} ${styles.dateZone}`}>
      <DiaryDateLine
        dateLine={dateLine}
        className={styles.dateLine}
        slashClassName={styles.dateSlash}
        handwritingClassName={handwritingClassName}
      />
    </header>
  );
}
