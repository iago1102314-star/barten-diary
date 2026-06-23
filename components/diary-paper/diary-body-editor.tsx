"use client";

import styles from "@/components/diary-paper/diary-paper.module.css";
import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  type ChangeEvent,
} from "react";
import { useFormStatus } from "react-dom";

export type DiaryBodyEditorProps = {
  diaryId: string;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  formAction: (payload: FormData) => void;
  error?: string;
};

function syncTextareaHeight(textarea: HTMLTextAreaElement) {
  textarea.style.height = "0px";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

export const DiaryBodyEditor = forwardRef<HTMLDivElement, DiaryBodyEditorProps>(
  function DiaryBodyEditor(
    { diaryId, value, onChange, onCancel, formAction, error },
    ref,
  ) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const resizeTextarea = useCallback(() => {
      const el = textareaRef.current;
      if (!el) return;
      syncTextareaHeight(el);
    }, []);

    useLayoutEffect(() => {
      resizeTextarea();
    }, [value, resizeTextarea]);

    useLayoutEffect(() => {
      if (document.fonts?.ready) {
        void document.fonts.ready.then(resizeTextarea);
      }

      window.addEventListener("resize", resizeTextarea, { passive: true });
      return () => window.removeEventListener("resize", resizeTextarea);
    }, [resizeTextarea]);

    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
      onChange(event.target.value);
      syncTextareaHeight(event.target);
    };

    return (
      <div ref={ref} className={styles.bodyEditWrap}>
        <form action={formAction} className={styles.bodyEditForm}>
          <input type="hidden" name="id" value={diaryId} />
          <textarea
            ref={textareaRef}
            name="body"
            value={value}
            onChange={handleChange}
            required
            rows={1}
            className={styles.bodyTextarea}
            aria-label="日記本文"
            autoComplete="off"
            autoCorrect="on"
            spellCheck
          />
          {error ? (
            <p role="alert" className={styles.bodyEditError}>
              {error}
            </p>
          ) : null}
          <div className={styles.bodyEditActions}>
            <SaveButton />
            <button
              type="button"
              className={styles.bodyEditCancel}
              onClick={onCancel}
            >
              やめる
            </button>
          </div>
        </form>
      </div>
    );
  },
);

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={styles.bodyEditSave}
      aria-busy={pending}
    >
      {pending ? "保存しています…" : "保存する"}
    </button>
  );
}
