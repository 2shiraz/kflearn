import { logoUrl, useBranding } from "../lib/branding";

// The site logo: the admin's uploaded logo when there is one, otherwise the
// KF monogram (public/logo.svg) with no tile behind it. The favicon and app
// icons keep the indigo tile so they stay legible in browser tabs.
export default function BrandMark({ size = 34 }) {
  const branding = useBranding();
  return <img src={logoUrl(branding)} alt="" width={size} height={size} className="shrink-0 select-none object-contain" draggable="false" />;
}
