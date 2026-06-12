import { cn } from "@/lib/utils";

type IconProps = { className?: string };

/** 洞洞球 */
export function PickleballIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <circle cx="16" cy="16" r="13" fill="currentColor" opacity="0.15" />
      <circle cx="16" cy="16" r="9" fill="currentColor" opacity="0.35" />
      <circle cx="13" cy="14" r="1.2" fill="currentColor" opacity="0.65" />
      <circle cx="18" cy="13" r="1.2" fill="currentColor" opacity="0.65" />
      <circle cx="16" cy="18" r="1.2" fill="currentColor" opacity="0.65" />
      <circle cx="19" cy="16" r="0.9" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

/** 直立匹克球拍：寬扁實心拍面 + 短握把 */
export function PickleballPaddleIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 32 48"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect
        x="4"
        y="2"
        width="24"
        height="28"
        rx="4.5"
        fill="currentColor"
        opacity="0.38"
      />
      <line
        x1="9"
        y1="9"
        x2="21"
        y2="23"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.25"
      />
      <rect
        x="11.5"
        y="29"
        width="9"
        height="15"
        rx="2.5"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );
}
