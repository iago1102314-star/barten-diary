type TriNavIconProps = {
  direction: "left" | "right";
  className?: string;
};

/** ページ送り — `/public/tri.svg` と同型（上向き三角を回転） */
export function TriNavIcon({ direction, className }: TriNavIconProps) {
  const rotation = direction === "left" ? -90 : 90;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden
    >
      <path d="M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    </svg>
  );
}
