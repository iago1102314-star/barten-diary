"use client";

import {
  layoutMasterDialogueShown,
  type MasterDialogueLayout,
} from "@/lib/entrance/master-dialogue-layout";
import {
  MASTER_DIALOGUE_TYPOGRAPHY,
  resolveMasterDialogueTypewriterSpeedMs,
} from "@/lib/entrance/master-dialogue-typography";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type MasterDialogueBodyProps = {
  text: string;
  speed?: number;
  startDelay?: number;
  onDone?: () => void;
  /** 先頭から即表示し、残りだけタイプ */
  initialShown?: string;
};

export type MasterDialogueBodyHandle = {
  completeTyping: () => void;
};

function remToPx(rem: number): number {
  if (typeof document === "undefined") return rem * 16;
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

function emptyLayout(maxIndentPx: number): MasterDialogueLayout {
  return {
    lines: [],
    firstLineIndentPx: maxIndentPx,
    bodyIndentPx: maxIndentPx,
  };
}

/** マスター吹き出し本文 — 1行目固定インデント + タイプライター */
export const MasterDialogueBody = forwardRef<
  MasterDialogueBodyHandle,
  MasterDialogueBodyProps
>(function MasterDialogueBody(
  {
    text,
    speed = resolveMasterDialogueTypewriterSpeedMs(),
    startDelay = 0,
    onDone,
    initialShown,
  },
  ref,
) {
  const t = MASTER_DIALOGUE_TYPOGRAPHY;
  const contentRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const doneRef = useRef(onDone);
  const typingDoneRef = useRef(false);
  const timersRef = useRef<{
    start?: ReturnType<typeof setTimeout>;
    tick?: ReturnType<typeof setTimeout>;
  }>({});
  const [contentWidthPx, setContentWidthPx] = useState(0);
  const [shown, setShown] = useState("");
  const [typingDone, setTypingDone] = useState(false);

  const maxIndentPx = remToPx(t.bodyTextIndentRem) + t.bodyTextIndentExtraPx;
  const paddingRightPx = remToPx(t.bodyPaddingRightRem);
  const [layout, setLayout] = useState<MasterDialogueLayout>(() =>
    emptyLayout(maxIndentPx),
  );

  doneRef.current = onDone;
  typingDoneRef.current = typingDone;

  const clearTypingTimers = useCallback(() => {
    const { start, tick } = timersRef.current;
    if (start) clearTimeout(start);
    if (tick) clearTimeout(tick);
    timersRef.current = {};
  }, []);

  const finishTyping = useCallback(() => {
    if (typingDoneRef.current) return;
    clearTypingTimers();
    setShown(text);
    setTypingDone(true);
    typingDoneRef.current = true;
    doneRef.current?.();
  }, [clearTypingTimers, text]);

  useImperativeHandle(ref, () => ({
    completeTyping: finishTyping,
  }), [finishTyping]);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    const update = () => setContentWidthPx(node.clientWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const prefix =
      initialShown && text.startsWith(initialShown) ? initialShown : "";
    const startIndex = prefix.length;

    setShown(prefix);
    const alreadyDone = startIndex >= text.length;
    setTypingDone(alreadyDone);
    typingDoneRef.current = alreadyDone;
    setLayout(emptyLayout(maxIndentPx));
    clearTypingTimers();

    if (alreadyDone) {
      if (startIndex > 0) {
        doneRef.current?.();
      }
      return;
    }

    let index = startIndex;

    const startTimer = setTimeout(() => {
      const tick = () => {
        index += 1;
        setShown(text.slice(0, index));

        if (index < text.length) {
          timersRef.current.tick = setTimeout(tick, speed);
        } else {
          finishTyping();
        }
      };

      tick();
    }, startDelay);

    timersRef.current.start = startTimer;

    return clearTypingTimers;
  }, [
    text,
    speed,
    startDelay,
    initialShown,
    maxIndentPx,
    clearTypingTimers,
    finishTyping,
  ]);

  useLayoutEffect(() => {
    const measureNode = measureRef.current;
    if (!measureNode || contentWidthPx <= 0 || !shown) {
      setLayout(
        shown
          ? {
              lines: [shown],
              firstLineIndentPx: maxIndentPx,
              bodyIndentPx: maxIndentPx,
            }
          : emptyLayout(maxIndentPx),
      );
      return;
    }

    const measure = (value: string) => {
      measureNode.textContent = value;
      return measureNode.getBoundingClientRect().width;
    };

    if (measure("あ") <= 0) {
      setLayout({
        lines: [shown],
        firstLineIndentPx: maxIndentPx,
        bodyIndentPx: maxIndentPx,
      });
      return;
    }

    const textAreaWidthPx = contentWidthPx - paddingRightPx;
    const layoutOptions = {
      textAreaWidthPx,
      maxIndentPx,
      measure,
    };

    setLayout(layoutMasterDialogueShown(text, shown, layoutOptions));
  }, [
    text,
    shown,
    contentWidthPx,
    paddingRightPx,
    maxIndentPx,
    t.bodyPaddingRightRem,
    t.bodyLetterSpacingEm,
  ]);

  const bodyStyle = {
    color: t.bodyColor,
    fontSize: t.bodyFontSize,
    lineHeight: t.bodyLineHeight,
    letterSpacing: `${t.bodyLetterSpacingEm}em`,
  } as const;

  return (
    <div ref={contentRef} className="relative min-w-0 flex-1">
      <span
        ref={measureRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 whitespace-pre font-serif-jp opacity-0"
        style={bodyStyle}
      />
      <div
        style={{
          paddingRight: `${t.bodyPaddingRightRem}rem`,
          paddingBottom: `${t.bodyPaddingBottomRem}rem`,
        }}
      >
        {layout.lines.map((line, index) => (
          <p
            key={index}
            className="font-serif-jp"
            style={{
              ...bodyStyle,
              paddingLeft:
                index === 0 ? layout.firstLineIndentPx : layout.bodyIndentPx,
              margin: 0,
            }}
          >
            {line}
            {index === layout.lines.length - 1 && !typingDone && (
              <span
                aria-hidden
                className="ml-[2px] inline-block w-[2px] animate-pulse bg-[#e8b06a]/80 align-middle"
              >
                &nbsp;
              </span>
            )}
          </p>
        ))}
      </div>
    </div>
  );
});
