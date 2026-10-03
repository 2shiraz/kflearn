// Original SVG illustrations for the public pages. Drawn in-house so there are
// no licensing or download costs, and they stay sharp on any screen.

const C = {
  pink: "#FF8FCF",
  violet: "#C6A6FF",
  blue: "#7FB8FF",
  mint: "#7FE3C4",
  gold: "#FFD84D",
  ink: "#1F2937",
  soft: "#6B7280",
  paper: "#FFFFFF",
};

const steps = [
  { label: "You ask", sub: "Type or speak a question", color: C.pink },
  { label: "AI patient replies", sub: "Only from the script facts", color: C.violet },
  { label: "Transcript", sub: "You review before it counts", color: C.blue },
  { label: "AI marks items", sub: "Each item cites evidence", color: C.mint },
  { label: "App scores", sub: "Weighted percentage", color: C.gold },
];

export function AiPracticeLoop({ className = "" }) {
  const w = 160;
  const gap = 30;
  const h = 120;
  const total = steps.length * w + (steps.length - 1) * gap;
  return (
    <svg viewBox={`0 0 ${total} ${h + 30}`} className={className} role="img" aria-label="Five steps: you ask, AI patient replies, transcript review, AI marks items, the app calculates the score" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill={C.soft} />
        </marker>
      </defs>
      {steps.map((s, i) => {
        const x = i * (w + gap);
        return (
          <g key={s.label}>
            <rect x={x} y={10} width={w} height={h} rx={16} fill={C.paper} stroke={s.color} strokeWidth={2.5} />
            <rect x={x + 16} y={24} width={28} height={6} rx={3} fill={s.color} />
            <text x={x + 16} y={62} fontSize={15} fontWeight={700} fill={C.ink} fontFamily="Sora, Inter, sans-serif">{s.label}</text>
            <text x={x + 16} y={86} fontSize={12} fill={C.soft} fontFamily="Inter, sans-serif">{s.sub}</text>
            <text x={x + 16} y={112} fontSize={11} fontWeight={700} fill={s.color === C.gold ? "#B45309" : s.color} fontFamily="Inter, sans-serif">
              {i === 0 || i === 2 ? "YOU" : i === 4 ? "APP" : "AI"}
            </text>
            {i < steps.length - 1 && (
              <line x1={x + w + 4} y1={10 + h / 2} x2={x + w + gap - 4} y2={10 + h / 2} stroke={C.soft} strokeWidth={2} markerEnd="url(#arrow)" />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function ConsultationScene({ className = "" }) {
  return (
    <svg viewBox="0 0 520 380" className={className} role="img" aria-label="Illustration of a student speaking with a virtual patient while a checklist is ticked" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="520" height="380" rx="28" fill="#F5F3FF" />
      <circle cx="120" cy="170" r="150" fill="#FFE3F4" opacity="0.7" />
      <circle cx="400" cy="250" r="120" fill="#DDEBFF" opacity="0.8" />

      {/* Student */}
      <circle cx="130" cy="150" r="34" fill="#FBD5B5" />
      <path d="M96 140 Q130 98 164 140 Q160 120 130 116 Q100 118 96 140 Z" fill="#1F2937" />
      <rect x="96" y="190" width="68" height="110" rx="26" fill={C.violet} />
      <rect x="110" y="200" width="40" height="8" rx="4" fill="#fff" opacity="0.6" />

      {/* Virtual patient */}
      <circle cx="330" cy="150" r="34" fill="#F8C9A0" />
      <path d="M298 146 Q302 112 330 110 Q360 112 362 146 Q350 124 330 124 Q310 124 298 146 Z" fill="#6B4F3A" />
      <rect x="296" y="190" width="68" height="110" rx="26" fill={C.blue} />
      <path d="M318 240 L330 254 L342 240" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />

      {/* Speech bubbles */}
      <rect x="170" y="36" width="170" height="54" rx="18" fill="#fff" stroke={C.pink} strokeWidth="2" />
      <text x="186" y="60" fontSize="14" fill={C.ink} fontFamily="Inter, sans-serif">Tell me about the pain.</text>
      <text x="186" y="78" fontSize="12" fill={C.soft} fontFamily="Inter, sans-serif">When did it start?</text>
      <rect x="230" y="96" width="160" height="46" rx="18" fill="#fff" stroke={C.blue} strokeWidth="2" />
      <text x="246" y="124" fontSize="14" fill={C.ink} fontFamily="Inter, sans-serif">It started two days ago.</text>

      {/* Checklist card */}
      <rect x="250" y="230" width="230" height="130" rx="18" fill="#fff" stroke="#E5E7EB" strokeWidth="2" />
      <text x="270" y="262" fontSize="14" fontWeight="700" fill={C.ink} fontFamily="Sora, Inter, sans-serif">Checklist</text>
      {[
        { y: 282, done: true, label: "Onset" },
        { y: 304, done: true, label: "Site and radiation" },
        { y: 326, done: false, label: "Red flags" },
      ].map((row) => (
        <g key={row.label}>
          <circle cx="278" cy={row.y - 4} r="8" fill={row.done ? C.mint : "#fff"} stroke={row.done ? "#10B981" : "#D1D5DB"} strokeWidth="2" />
          {row.done && <path d={`M274 ${row.y - 4} l3 3 l6 -6`} fill="none" stroke="#065F46" strokeWidth="2" strokeLinecap="round" />}
          <text x="296" y={row.y} fontSize="13" fill={row.done ? C.ink : C.soft} fontFamily="Inter, sans-serif">{row.label}</text>
        </g>
      ))}
    </svg>
  );
}
