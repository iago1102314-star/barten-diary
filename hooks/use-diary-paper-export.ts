"use client";

import { formatDiaryExportFilename } from "@/lib/diary-paper/format-diary-export-filename";
import { domToBlob } from "modern-screenshot";
import { useCallback, useState, type RefObject } from "react";

export type DiaryExportNotice = {
  type: "success" | "error";
  text: string;
};

type UseDiaryPaperExportOptions = {
  captureRef: RefObject<HTMLElement | null>;
  createdAt: string;
};

async function waitForCaptureReady(node: HTMLElement) {
  await document.fonts.ready;

  const images = node.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function useDiaryPaperExport({
  captureRef,
  createdAt,
}: UseDiaryPaperExportOptions) {
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState<DiaryExportNotice | null>(null);

  const dismissNotice = useCallback(() => {
    setNotice(null);
  }, []);

  const exportDiary = useCallback(async () => {
    const node = captureRef.current;
    if (!node || exporting) return;

    setExporting(true);
    setNotice(null);

    try {
      await waitForCaptureReady(node);
      node.setAttribute("data-diary-exporting", "true");
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      const captureWidth = Math.ceil(node.getBoundingClientRect().width);
      const blob = await domToBlob(node, {
        scale: Math.min(window.devicePixelRatio || 1, 2),
        width: captureWidth > 0 ? captureWidth : undefined,
        timeout: 30_000,
      });

      const filename = formatDiaryExportFilename(createdAt);
      const file = new File([blob], filename, { type: "image/png" });

      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        setNotice({ type: "success", text: "共有しました" });
        return;
      }

      downloadBlob(blob, filename);
      setNotice({ type: "success", text: "日記をダウンロードしました" });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setNotice({ type: "error", text: "画像の保存に失敗しました" });
    } finally {
      captureRef.current?.removeAttribute("data-diary-exporting");
      setExporting(false);
    }
  }, [captureRef, createdAt, exporting]);

  return {
    exportDiary,
    exporting,
    notice,
    dismissNotice,
  };
}
