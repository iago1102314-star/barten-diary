"use client";

import { useEffect, useRef, useState } from "react";

type TypewriterProps = {
  text: string;
  speed?: number;
  startDelay?: number;
  onDone?: () => void;
  className?: string;
  showCaret?: boolean;
};

export function Typewriter({
  text,
  speed = 55,
  startDelay = 0,
  onDone,
  className = "",
  showCaret = true,
}: TypewriterProps) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    setShown("");
    setDone(false);

    let i = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const startTimer = setTimeout(() => {
      const tick = () => {
        i += 1;
        setShown(text.slice(0, i));

        if (i < text.length) {
          timer = setTimeout(tick, speed);
        } else {
          setDone(true);
          doneRef.current?.();
        }
      };

      tick();
    }, startDelay);

    return () => {
      clearTimeout(startTimer);
      if (timer) clearTimeout(timer);
    };
  }, [text, speed, startDelay]);

  return (
    <span className={className}>
      {shown}
      {showCaret && !done && (
        <span
          aria-hidden
          className="ml-[2px] inline-block w-[2px] animate-pulse bg-[#e8b06a]/80 align-middle"
        >
          &nbsp;
        </span>
      )}
    </span>
  );
}
