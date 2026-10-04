"use client";

import { useState } from "react";
import { Heart } from "./Heart";

export function HeartRating({
  value,
  onChange,
  size = "sm",
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "lg";
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const shown = hovered ?? value;
  const heart = size === "lg" ? "h-7 w-7" : "h-4 w-4";

  if (!onChange) {
    return (
      <div className="flex items-center gap-0.5 text-gold" role="img" aria-label={`${value} out of 5 hearts`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Heart key={n} filled={n <= value} className={heart} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Rate ${n} of 5`}
          aria-pressed={n === value}
          onMouseEnter={() => setHovered(n)}
          onFocus={() => setHovered(n)}
          onBlur={() => setHovered(null)}
          onClick={() => onChange(n)}
          className="grid h-11 w-11 place-items-center text-gold transition-transform hover:scale-110 active:scale-95"
        >
          <Heart filled={n <= shown} className={`${heart} ${n <= shown ? "animate-pop" : ""}`} />
        </button>
      ))}
    </div>
  );
}
