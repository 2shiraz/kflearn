import { useMemo } from "react";
import { getCurrentUser } from "../lib/api";
import { useSite } from "../lib/site";

// Sections whose pages show study content.
const STUDY_SECTIONS = ["stations", "mcqs", "ospe", "history", "clinical-exam", "handouts", "progress"];

// When an admin turns it on, the signed-in student's email is tiled faintly
// across study pages, so a screenshot shared outside shows whose account it
// came from. It sits above the page but ignores clicks, so nothing changes
// for the student.
export default function Watermark({ active }) {
  const site = useSite();
  const user = getCurrentUser();
  const show = site.watermark && user?.email && !["admin", "contributor"].includes(user.role) && STUDY_SECTIONS.includes(active);
  const tile = useMemo(() => {
    if (!show) return "";
    const label = `${user.email} / ${String(user.id || "").slice(-6)}`.replace(/[<>&"']/g, "");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="230"><text x="20" y="130" transform="rotate(-22 190 115)" font-family="system-ui, sans-serif" font-size="14" fill="#23296e" fill-opacity="0.07">${label}</text></svg>`;
    return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
  }, [show, user?.email, user?.id]);
  if (!show) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-20 select-none print:block"
      style={{ backgroundImage: tile, backgroundRepeat: "repeat" }}
    />
  );
}
