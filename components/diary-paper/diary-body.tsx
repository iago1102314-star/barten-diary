import styles from "@/components/diary-paper/diary-paper.module.css";

type DiaryBodyProps = {
  body: string;
};

export function DiaryBody({ body }: DiaryBodyProps) {
  const normalized = body.replace(/\r\n?/g, "\n").replace(/\n+$/, "");
  if (!normalized.trim()) return null;

  return (
    <div className={styles.body}>
      <p className={styles.paragraph}>{normalized}</p>
    </div>
  );
}
