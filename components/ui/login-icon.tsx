type LoginIconProps = {
  className?: string;
  sizePx?: number;
};

/** `/public/login.svg` と同型 */
export function LoginIcon({ className, sizePx = 24 }: LoginIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={sizePx}
      height={sizePx}
      className={className}
      aria-hidden
    >
      <path d="m10 17 5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    </svg>
  );
}
