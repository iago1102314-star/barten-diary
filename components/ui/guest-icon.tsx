type GuestIconProps = {
  className?: string;
  sizePx?: number;
};

/** ゲスト — シルエットアイコン */
export function GuestIcon({ className, sizePx = 40 }: GuestIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={sizePx}
      height={sizePx}
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 19.5c.9-3.1 3.2-4.8 6.5-4.8s5.6 1.7 6.5 4.8" />
    </svg>
  );
}
