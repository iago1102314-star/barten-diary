import { ShebronIcon } from "@/components/ui/shebron-icon";
import styles from "@/components/memories/memo-shelf-grid.module.css";

type MemoShelfTopBarProps = {
  onBack: () => void;
  backLabel: string;
};

export function MemoShelfTopBar({ onBack, backLabel }: MemoShelfTopBarProps) {
  return (
    <header className={styles.topBar}>
      <div className={styles.topBarSide}>
        <button
          type="button"
          className={styles.topBarBack}
          onClick={onBack}
          aria-label={backLabel}
        >
          <ShebronIcon className={styles.topBarIcon} />
        </button>
      </div>
      <h1 className={styles.topBarTitle}>夜の記録</h1>
      <div className={`${styles.topBarSide} ${styles.topBarSideRight}`} aria-hidden />
    </header>
  );
}
