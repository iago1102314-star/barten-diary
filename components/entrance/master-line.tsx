type MasterLineProps = {
  children: string;
  className?: string;
};

export function MasterLine({ children, className = "" }: MasterLineProps) {
  return (
    <p
      className={`text-center text-[15px] leading-relaxed tracking-wide text-stone-100/90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] ${className}`}
    >
      {children}
    </p>
  );
}
