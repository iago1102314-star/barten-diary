"use client";

import type { LabReviewNote } from "@/lib/ai/quality/review-types";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "barten-diary-lab-reviews";

export function useLabReviews() {
  const [reviews, setReviews] = useState<Record<string, LabReviewNote>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setReviews(JSON.parse(raw) as Record<string, LabReviewNote>);
      }
    } catch {
      setReviews({});
    }
  }, []);

  const upsertReview = useCallback((note: LabReviewNote) => {
    setReviews((prev) => {
      const next = { ...prev, [note.id]: note };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearReviews = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setReviews({});
  }, []);

  return { reviews, upsertReview, clearReviews };
}
