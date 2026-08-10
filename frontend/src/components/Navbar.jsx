import { Stethoscope } from "lucide-react";

const links = ["Features", "Sample Stations", "Pricing", "About"];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <a href="#" className="flex items-center gap-2 font-display text-lg font-bold text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
            <Stethoscope size={18} strokeWidth={2.5} />
          </span>
          KF LearnSmart
        </a>

        <ul className="hidden items-center gap-8 text-sm font-medium text-ink-soft md:flex">
          {links.map((l) => (
            <li key={l}>
              <a href="#" className="transition hover:text-ink">
                {l}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-5">
          <a href="/signin" className="hidden text-sm font-medium text-ink-soft hover:text-ink sm:block">
            Sign in
          </a>
          <a
            href="#"
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-brand-dark"
          >
            Start Free
          </a>
        </div>
      </nav>
    </header>
  );
}
