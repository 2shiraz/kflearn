import { Link } from "react-router-dom";
import BrandMark from "./BrandMark";
import { SIGNUP_LABEL } from "../site/siteContent";
import { SiteName } from "../lib/branding";

const columns = [
  {
    heading: "Product",
    links: [
      { label: "Features", to: "/features" },
      { label: "Sample stations", to: "/sample-stations" },
      { label: "Pricing", to: "/pricing" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Sign in", to: "/signin" },
      { label: SIGNUP_LABEL, to: "/signup" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-s-line bg-s-card">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link to="/" className="flex min-h-11 items-center gap-2.5">
              <BrandMark size={30} />
              <span className="text-[15px] font-semibold tracking-tight text-s-ink"><SiteName /></span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-s-mute">
              OSCE, OSPE and MCQ preparation for medical students in Pakistan, with an AI virtual patient for every OSCE station.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.heading}>
              <p className="text-sm font-semibold text-s-ink">{col.heading}</p>
              <ul className="mt-2">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="inline-flex min-h-11 items-center text-sm text-s-mute transition-colors hover:text-s-accent">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-s-line pt-6 text-xs leading-relaxed text-s-mute">
          <p className="max-w-3xl">
            KF LearnSmart is a self-practice tool for medical students. It is not affiliated with any examining body, and AI feedback is formative: it is not a clinical result, diagnosis or certification.
          </p>
          <p className="mt-3">&copy; {new Date().getFullYear()} <SiteName /></p>
        </div>
      </div>
    </footer>
  );
}
