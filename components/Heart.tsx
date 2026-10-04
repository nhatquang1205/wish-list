import type { CSSProperties } from "react";

const HEART_PATH =
  "M12 20.7 4.3 13.4a4.9 4.9 0 0 1-.4-6.7 4.6 4.6 0 0 1 7-.2l1.1 1.2 1.1-1.2a4.6 4.6 0 0 1 7 .2 4.9 4.9 0 0 1-.4 6.7L12 20.7Z";

export function Heart({
  filled,
  className = "",
  style,
}: {
  filled: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      style={style}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.4}
      strokeLinejoin="round"
    >
      <path d={HEART_PATH} />
    </svg>
  );
}
