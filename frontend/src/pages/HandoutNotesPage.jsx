import { useParams } from "react-router-dom";
import {
  Bone,
  Brain,
  Droplet,
  Filter,
  HeartPulse,
  ScrollText,
  Soup,
  Wind,
} from "lucide-react";
import { Breadcrumbs, PageMain, Panel, RequireUser } from "../components/AppPage";
import { GuideCard, GuideHero, GuideNotFound, GuideSection, GuideTitle, JumpNav, PanelHeading, PrevNext, SectionHeading } from "../components/GuideBlocks";
import { plus } from "../site/siteContent";
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

const categoryIcon = (category) => CATEGORY_ICONS[category] || ScrollText;

// One colour per body system, so a system reads the same on every card.
const CATEGORY_TONES = {
  Cardiovascular: "coral",
  Respiratory: "sky",
  "Endocrine & Metabolic": "sun",
  "Gastrointestinal & Hepatobiliary": "mint",
  "Renal & Urology": "indigo",
  "Musculoskeletal & Rheumatology": "violet",
  Neurology: "violet",
};
const categoryTone = (category) => CATEGORY_TONES[category] || "violet";

export function HandoutNotesHome() {
  return (
    <RequireUser active="handouts">
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "Handout Notes" }]} />

        <GuideHero
          eyebrow="Handout notes"
          title="Handout Notes"
          description={`${plus(handouts.length)} station handouts. Each covers core concepts, clinical features, diagnosis, management and key takeaways.`}
          character="student-hira"
          tone="violet"
        />

        <JumpNav
          items={[
            { href: "#how-to-use", label: "How to use this collection" },
            { href: "#by-topic", label: "By topic" },
          ]}
        />

        <div className="grid gap-6">
          <Panel id="how-to-use" className="scroll-mt-24">
            <PanelHeading title={aboutThisCollection.title} subtitle={aboutThisCollection.subtitle} />
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {aboutThisCollection.points.map((point, index) => (
                <li key={index} className="flex gap-3 rounded-2xl border border-s-line bg-s-card p-3.5 text-sm leading-relaxed text-s-mute">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-soft font-chart text-xs text-violet" aria-hidden="true">{index + 1}</span>
                  <span className="pt-0.5">{point}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-2xl bg-s-tint/60 p-4 text-sm italic leading-relaxed text-s-mute">{aboutThisCollection.disclaimer}</p>
          </Panel>

          <section id="by-topic" className="scroll-mt-24">
            <SectionHeading description="Every handout, grouped by body system.">By topic</SectionHeading>
            <div className="space-y-8">
              {CATEGORY_ORDER.map((category) => {
                const categoryHandouts = handouts.filter((handout) => handout.category === category);
                if (categoryHandouts.length === 0) return null;
                const Icon = categoryIcon(category);
                return (
                  <div key={category}>
                    <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-s-ink">
                      <Icon size={17} strokeWidth={2} className="text-s-mute" aria-hidden="true" />
                      {category}
                      <span className="rounded-full bg-s-tint px-2.5 py-0.5 font-chart text-xs font-normal text-s-mute">{categoryHandouts.length}</span>
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {categoryHandouts.map((handout, i) => (
                        <GuideCard
                          key={handout.slug}
                          to={`/handout-notes/${handout.slug}`}
                          icon={Icon}
                          tone={categoryTone(category)}
                          title={handout.title}
                          summary={handout.summary}
                          cta="Read handout"
                          index={i}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
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
          <GuideNotFound what="handout" backTo="/handout-notes" backLabel="Back to the handouts" />
        </PageMain>
      </RequireUser>
    );
  }

  const { prev, next } = getAdjacentHandouts(slug);

  return (
    <RequireUser active="handouts">
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "Handout Notes", to: "/handout-notes" }, { label: handout.title }]} />
        <GuideTitle icon={categoryIcon(handout.category)} tone={categoryTone(handout.category)} eyebrow={handout.category} title={handout.title} summary={handout.summary} />
        <Panel className="site-rise" style={{ "--rise-delay": "80ms" }}>
          {handout.sections.map((section) => (
            <GuideSection key={section.heading} {...section} />
          ))}
        </Panel>
        <PrevNext prev={prev} next={next} base="/handout-notes" allLabel="All handouts" />
      </PageMain>
    </RequireUser>
  );
}
