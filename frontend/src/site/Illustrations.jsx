import { healthIcons } from "./healthIconData";

// A Healthicons medical icon. Colour comes from the surrounding text colour.
export function HealthIcon({ name, size = 28, className = "", label }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
      // Static, bundled icon markup (see healthIconData.js), never user input.
      dangerouslySetInnerHTML={{ __html: healthIcons[name] }}
    />
  );
}

// Full-colour 3D medical icon (Microsoft Fluent Emoji, MIT), served from
// /illustrations/medical. Accepts a file name ("anatomical-heart") or one of
// the older Healthicons names below, so existing call sites keep working.
const MED_ALIASES = {
  heart: "anatomical-heart",
  bloodDrop: "drop-of-blood",
  doctor: "health-worker",
  patient: "clipboard",
  book: "books",
  medicines: "pill",
  cardiogram: "chart-increasing",
  stomach: "microbe",
  medicalRecords: "memo",
};

export function MedIcon({ name, size = 32, className = "", alt = "" }) {
  const file = MED_ALIASES[name] || name;
  return (
    <img
      src={`/illustrations/medical/${file}.png`}
      alt={alt}
      aria-hidden={alt ? undefined : "true"}
      width={size}
      height={size}
      decoding="async"
      className={`shrink-0 select-none object-contain ${className}`}
      draggable="false"
    />
  );
}

// Pixel-art character in a coloured circle.
const RING = {
  indigo: "bg-s-accent-soft",
  sky: "bg-sky-soft",
  mint: "bg-mint-soft",
  coral: "bg-coral-soft",
  sun: "bg-sun-soft",
  violet: "bg-violet-soft",
};

export function Character({ name, alt = "", size = 56, tone = "indigo", className = "" }) {
  return (
    <span
      className={`inline-flex shrink-0 items-end justify-center overflow-hidden rounded-full ${RING[tone]} ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={`/illustrations/characters/${name}.svg`}
        alt={alt}
        width={size}
        height={size}
        className="pixel h-full w-full"
        loading="lazy"
      />
    </span>
  );
}

// Animated voice bars, shown while the virtual patient is "speaking".
export function VoiceBars({ className = "" }) {
  return (
    <span className={`inline-flex h-3.5 items-center gap-[3px] ${className}`} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="voice-bar block h-full w-[3px] rounded-full bg-current" style={{ animationDelay: `${i * 110}ms` }} />
      ))}
    </span>
  );
}

// A simple ECG trace (one QRS complex) used as a hand-drawn underline.
export function EcgLine({ className = "" }) {
  return (
    <svg viewBox="0 0 220 28" fill="none" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path
        className="ecg-line"
        pathLength="1"
        d="M0 18 H70 L80 18 L86 10 L92 18 H104 L110 24 L118 2 L126 26 L132 18 H150 L160 14 L170 18 H220"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
