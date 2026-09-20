import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bone,
  Brain,
  Droplet,
  Filter,
  HeartPulse,
  ListChecks,
  ScrollText,
  Soup,
  Wind,
} from "lucide-react";
import { Breadcrumbs, ErrorMessage, PageMain, Panel, RequireUser } from "../components/AppPage";
import { GuideSection, JumpNav } from "../components/GuideBlocks";
import {
  aboutThisCollection,
  CATEGORY_ORDER,
  getAdjacentHandouts,
  getHandout,
  handouts,
} from "../data/handoutNotes";

const CATEGORY_ICONS = {
  Cardiovascular: HeartPulse,
  Respiratory: Wind,
  "Endocrine & Metabolic": Droplet,
  "Gastrointestinal & Hepatobiliary": Soup,
  "Renal & Urology": Filter,
  "Musculoskeletal & Rheumatology": Bone,
  Neurology: Brain,
};

function CategoryIcon({ category, ...props }) {
  const Icon = CATEGORY_ICONS[category] || ScrollText;
  return <Icon {...props} />;
}

export function HandoutNotesHome() {
  return (
    <RequireUser active="handouts">
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "Handout Notes" }]} />

        <div className="mb-6">
          <p className="text-sm font-semibold text-ink-soft">Static reference</p>
          <h1 className="mt-1 text-4xl font-extrabold text-ink">Handout Notes</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            A concise revision collection of {handouts.length} OSCE station handouts — Introduction, Core Concepts,
            Clinical Features, Diagnosis, Management, Important Management Considerations, and Key Takeaways for each.
          </p>
        </div>

        <JumpNav
          items={[
            { href: "#how-to-use", label: "How to use this collection" },
            { href: "#by-topic", label: "By topic" },
          ]}
        />

        <div className="grid gap-5">
          <Panel id="how-to-use">
            <h2 className="text-lg font-bold text-ink">{aboutThisCollection.title}</h2>
            <p className="text-sm text-ink-soft">{aboutThisCollection.subtitle}</p>
            <ul className="mt-3 space-y-2">
              {aboutThisCollection.points.map((point, index) => (
                <li key={index} className="flex gap-2 rounded-lg border border-line bg-white/80 p-3 text-sm text-ink-soft">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-soft/60" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-lg border border-line bg-white/60 p-3 text-sm italic text-ink-soft">{aboutThisCollection.disclaimer}</p>
          </Panel>

          <div id="by-topic">
            <h2 className="mb-1 text-lg font-bold text-ink">By topic</h2>
            <p className="mb-3 text-sm text-ink-soft">All {handouts.length} handouts, grouped by system.</p>
            <div className="space-y-6">
              {CATEGORY_ORDER.map((category) => {
                const categoryHandouts = handouts.filter((handout) => handout.category === category);
                if (categoryHandouts.length === 0) return null;
                return (
                  <div key={category}>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink-soft">
                      <CategoryIcon category={category} size={15} />
                      {category}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {categoryHandouts.map((handout) => (
                        <Link key={handout.slug} to={`/handout-notes/${handout.slug}`} className="gradient-card group block rounded-lg p-5">
                          <span className="gradient-icon flex h-11 w-11 items-center justify-center rounded-lg text-ink">
                            <CategoryIcon category={handout.category} size={20} />
                          </span>
                          <h3 className="mt-4 font-display text-lg font-extrabold text-ink">{handout.title}</h3>
                          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{handout.summary}</p>
                          <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ink group-hover:underline">
                            Read handout <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </PageMain>
    </RequireUser>
  );
}

export function HandoutNotesDetail() {
  const { slug } = useParams();
  const handout = getHandout(slug);

  if (!handout) {
    return (
      <RequireUser active="handouts">
        <PageMain>
          <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "Handout Notes", to: "/handout-notes" }, { label: "Not found" }]} />
          <ErrorMessage message="That handout doesn't exist." />
          <Link to="/handout-notes" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:underline">
            <ArrowLeft size={14} /> Back to the handouts
          </Link>
        </PageMain>
      </RequireUser>
    );
  }

  const { prev, next } = getAdjacentHandouts(slug);

  return (
    <RequireUser active="handouts">
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "Handout Notes", to: "/handout-notes" }, { label: handout.title }]} />

        <div className="mb-6 flex items-start gap-4">
          <span className="gradient-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-ink">
            <CategoryIcon category={handout.category} size={26} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{handout.category}</p>
            <h1 className="text-3xl font-extrabold text-ink">{handout.title}</h1>
            <p className="mt-1 max-w-2xl text-ink-soft">{handout.summary}</p>
          </div>
        </div>

        <Panel>
          {handout.sections.map((section) => (
            <GuideSection key={section.heading} {...section} />
          ))}
        </Panel>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          {prev ? (
            <Link to={`/handout-notes/${prev.slug}`} className="glass-surface inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-ink">
              <ArrowLeft size={14} /> {prev.title}
            </Link>
          ) : <span />}
          <Link to="/handout-notes" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
            <ListChecks size={14} /> All handouts
          </Link>
          {next ? (
            <Link to={`/handout-notes/${next.slug}`} className="glass-surface inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-ink">
              {next.title} <ArrowRight size={14} />
            </Link>
          ) : <span />}
        </div>
      </PageMain>
    </RequireUser>
  );
}
