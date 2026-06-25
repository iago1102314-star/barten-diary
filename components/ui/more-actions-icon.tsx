type MoreActionsIconProps = {
  className?: string;
};

/** 3点メニュー */
export function MoreActionsIcon({ className }: MoreActionsIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="5.25" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="12" cy="18.75" r="1.75" />
    </svg>
  );
}
