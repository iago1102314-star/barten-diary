"use client";

import styles from "@/components/settings/app-settings-menu.module.css";
import { submitFeedback } from "@/app/feedback/actions";
import {
  FEEDBACK_BODY_MAX,
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_PLACEHOLDERS,
  FEEDBACK_TYPES,
  type FeedbackType,
} from "@/lib/feedback/types";
import { logBehaviorEvent } from "@/lib/analytics/behavior-log";
import { detectAppPlatform } from "@/lib/app-platform";
import { validateFeedbackInput } from "@/lib/feedback/validate-feedback";
import { playMenuTapSound } from "@/lib/settings/play-menu-sound";
import { useCallback, useRef, useState } from "react";

type SettingsFeedbackPanelProps = {
  onSuccess: () => void;
};

const SUBMIT_ERROR_MESSAGE =
  "送信できませんでした。時間をおいてもう一度お試しください。";

function formatSubmitError(result: {
  error?: string;
  errorCode?: string | null;
  errorDetails?: string | null;
}): string {
  const lines = [result.error ?? SUBMIT_ERROR_MESSAGE];
  if (result.errorCode) {
    lines.push(`code: ${result.errorCode}`);
  }
  if (result.errorDetails) {
    lines.push(`details: ${result.errorDetails}`);
  }
  return lines.join("\n");
}

export function SettingsFeedbackPanel({ onSuccess }: SettingsFeedbackPanelProps) {
  const [type, setType] = useState<FeedbackType>("review");
  const [rating, setRating] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  const handleTypeChange = useCallback((next: FeedbackType) => {
    playMenuTapSound();
    setType(next);
    if (next !== "review") {
      setRating(null);
    }
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitLockRef.current || submitting) return;

    const clientError = validateFeedbackInput({
      type,
      rating: type === "review" ? rating : null,
      body,
    });
    if (clientError) {
      setError(clientError);
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    setError(null);
    playMenuTapSound();

    try {
      const result = await submitFeedback({
        type,
        rating: type === "review" ? rating : null,
        body,
        pagePath: window.location.pathname,
        userAgent: navigator.userAgent,
        platform: detectAppPlatform(),
      });

      if (result.success) {
        void logBehaviorEvent("feedback_submit", { type });
        onSuccess();
        return;
      }

      setError(result.error ? formatSubmitError(result) : SUBMIT_ERROR_MESSAGE);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : SUBMIT_ERROR_MESSAGE;
      setError(message);
    } finally {
      submitLockRef.current = false;
      setSubmitting(false);
    }
  }, [body, onSuccess, rating, submitting, type]);

  return (
    <div className={styles.feedbackPanel}>
      <h2 className={styles.subPanelTitle}>フィードバック</h2>

      <fieldset className={styles.feedbackFieldset}>
        <legend className={styles.feedbackLegend}>カテゴリー</legend>
        <div className={styles.feedbackCategoryList}>
          {FEEDBACK_TYPES.map((category) => (
            <button
              key={category}
              type="button"
              className={`${styles.feedbackCategoryOption} ${
                type === category ? styles.feedbackCategoryOptionActive : ""
              }`}
              aria-pressed={type === category}
              disabled={submitting}
              onClick={() => handleTypeChange(category)}
            >
              {FEEDBACK_CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
      </fieldset>

      {type === "review" ? (
        <fieldset className={styles.feedbackFieldset}>
          <legend className={styles.feedbackLegend}>評価</legend>
          <div className={styles.feedbackRatingRow} role="radiogroup" aria-label="評価">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={`${styles.feedbackStarButton} ${
                  rating != null && value <= rating
                    ? styles.feedbackStarButtonActive
                    : ""
                }`}
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value}つ星`}
                disabled={submitting}
                onClick={() => {
                  playMenuTapSound();
                  setRating(value);
                  setError(null);
                }}
              >
                ★
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <label className={styles.feedbackTextareaLabel} htmlFor="settings-feedback-body">
        内容
      </label>
      <textarea
        id="settings-feedback-body"
        className={styles.feedbackTextarea}
        value={body}
        placeholder={FEEDBACK_PLACEHOLDERS[type]}
        maxLength={FEEDBACK_BODY_MAX}
        rows={5}
        disabled={submitting}
        onChange={(event) => {
          setBody(event.target.value);
          setError(null);
        }}
      />

      {error ? (
        <p className={styles.feedbackError} role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        className={styles.feedbackSubmitButton}
        disabled={submitting}
        onClick={() => void handleSubmit()}
      >
        {submitting ? "送信中…" : "送信"}
      </button>
    </div>
  );
}
