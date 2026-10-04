import { Heart } from "./Heart";

// Purely decorative: a few gold hearts drifting up behind the content.
const HEARTS = [
  { left: "6%", size: 22, delay: "0s", duration: "26s", opacity: 0.16 },
  { left: "23%", size: 14, delay: "6s", duration: "21s", opacity: 0.12 },
  { left: "44%", size: 28, delay: "12s", duration: "30s", opacity: 0.1 },
  { left: "61%", size: 16, delay: "3s", duration: "24s", opacity: 0.14 },
  { left: "79%", size: 24, delay: "16s", duration: "28s", opacity: 0.12 },
  { left: "92%", size: 13, delay: "9s", duration: "20s", opacity: 0.15 },
];

export function FloatingHearts() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {HEARTS.map((h, i) => (
        <span
          key={i}
          className="absolute bottom-[-10vh] animate-drift text-gold"
          style={{
            left: h.left,
            opacity: h.opacity,
            animationDelay: h.delay,
            animationDuration: h.duration,
          }}
        >
          <Heart filled={false} style={{ width: h.size, height: h.size }} className="block" />
        </span>
      ))}
    </div>
  );
}
