"use client";

import styles from "@/components/diary-paper/diary-paper.module.css";
import { useLayoutEffect, useState, type RefObject } from "react";

type BodyBand = {
  top: number;
  bottom: number;
};

type DiaryEditSepiaOverlayProps = {
  active: boolean;
  targetRef: RefObject<HTMLElement | null>;
};

function bandsEqual(a: BodyBand | null, b: BodyBand) {
  return a != null && a.top === b.top && a.bottom === b.bottom;
}

export function DiaryEditSepiaOverlay({
  active,
  targetRef,
}: DiaryEditSepiaOverlayProps) {
  const [band, setBand] = useState<BodyBand | null>(null);

  useLayoutEffect(() => {
    if (!active) {
      setBand(null);
      return;
    }

    let frame = 0;

    const measure = () => {
      const el = targetRef.current;
      if (!el) {
        setBand((prev) => (prev == null ? prev : null));
        return;
      }

      const rect = el.getBoundingClientRect();
      const next = { top: rect.top, bottom: rect.bottom };

      setBand((prev) => (bandsEqual(prev, next) ? prev : next));
    };

    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    scheduleMeasure();

    window.addEventListener("resize", scheduleMeasure, { passive: true });

    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", scheduleMeasure, { passive: true });
    viewport?.addEventListener("scroll", scheduleMeasure, { passive: true });

    const el = targetRef.current;
    const scrollRoot = el?.closest("[data-diary-paper-scroll]") ?? null;
    scrollRoot?.addEventListener("scroll", scheduleMeasure, { passive: true });

    const observer = el ? new ResizeObserver(scheduleMeasure) : null;
    if (el && observer) {
      observer.observe(el);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", scheduleMeasure);
      viewport?.removeEventListener("resize", scheduleMeasure);
      viewport?.removeEventListener("scroll", scheduleMeasure);
      scrollRoot?.removeEventListener("scroll", scheduleMeasure);
      observer?.disconnect();
    };
  }, [active, targetRef]);

  if (!active || !band) return null;

  return (
    <>
      <div
        className={styles.editSepiaScreenTop}
        style={{ height: Math.max(0, band.top) }}
        aria-hidden
      />
      <div
        className={styles.editSepiaScreenBottom}
        style={{ top: band.bottom }}
        aria-hidden
      />
    </>
  );
}
