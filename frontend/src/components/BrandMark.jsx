// The KF LearnSmart logo: the KF monogram with the graduation cap, drawn on
// its own with no tile behind it (public/logo.svg). The favicon and app icons
// keep the indigo tile so they stay legible in browser tabs.
export default function BrandMark({ size = 34 }) {
  return <img src="/logo.svg" alt="" width={size} height={size} className="shrink-0 select-none" draggable="false" />;
}
