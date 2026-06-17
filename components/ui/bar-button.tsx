"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "ghost" | "quiet";

type BarButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: Variant;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  /** primary — 背景を透過しぼかしなし */
  transparent?: boolean;
  /** primary — hover グロウの transition 時間（ms）。省略時 700 */
  hoverDurationMs?: number;
};

/**
 * バー共通ボタン。
 * - primary: 灯りに照らされた薄縁パネル。hover で暖色のグロウが滲む。
 * - ghost:   静かなテキスト操作。hover で細い線が中央から引かれる。
 * - quiet:   逃げ道・補助の控えめなリンク。
 */
export function BarButton({
  children,
  onClick,
  href,
  variant = "primary",
  disabled = false,
  className = "",
  type = "button",
  transparent = false,
  hoverDurationMs = 700,
}: BarButtonProps) {
  if (variant === "primary") {
    const hoverMs = hoverDurationMs;
    const surfaceClass = transparent
      ? "border-stone-100/12 bg-transparent backdrop-blur-none hover:border-amber-100/28 hover:bg-transparent"
      : "border-stone-100/12 bg-stone-950/25 backdrop-blur-md hover:border-amber-100/28 hover:bg-stone-950/40";
    const content = (
      <span
        className={`group relative block overflow-hidden rounded-[2px] border px-8 py-4 text-center transition-all ${surfaceClass}`}
        style={{ transitionDuration: `${hoverMs}ms` }}
      >
        {/* 上辺の微かな光沢 */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-stone-100/15 to-transparent"
        />
        {/* hover で下辺を灯りが舐める */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/2 h-px w-0 -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-200/70 to-transparent transition-all group-hover:w-full"
          style={{ transitionDuration: `${hoverMs}ms` }}
        />
        <span
          className="relative text-[11px] tracking-[0.4em] text-stone-300/85 transition-colors group-hover:text-amber-50/95"
          style={{ transitionDuration: `${hoverMs}ms` }}
        >
          {children}
        </span>
      </span>
    );
    return wrap(content, { href, onClick, disabled, type, className: `block w-full ${className}` });
  }

  if (variant === "ghost") {
    const content = (
      <span className="group relative inline-block px-1 py-1 text-[11px] tracking-[0.3em] text-stone-300/80 transition-colors duration-500 hover:text-amber-50/90">
        {children}
        <span
          aria-hidden
          className="absolute -bottom-0.5 left-1/2 h-px w-0 -translate-x-1/2 bg-amber-100/45 transition-all duration-500 group-hover:w-[calc(100%-0.5rem)]"
        />
      </span>
    );
    return wrap(content, { href, onClick, disabled, type, className });
  }

  const content = (
    <span className="text-[11px] tracking-[0.22em] text-stone-500/75 transition-colors duration-500 hover:text-stone-400/90">
      {children}
    </span>
  );
  return wrap(content, { href, onClick, disabled, type, className });
}

function wrap(
  content: ReactNode,
  {
    href,
    onClick,
    disabled,
    type,
    className = "",
  }: {
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit";
    className?: string;
  },
) {
  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`inline-block disabled:opacity-40 ${className}`}
      >
        {content}
      </Link>
    );
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {content}
    </button>
  );
}
