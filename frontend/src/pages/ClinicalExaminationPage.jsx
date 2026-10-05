import { useParams } from "react-router-dom";
import { ArrowRight, ScrollText } from "lucide-react";
import { Breadcrumbs, PageMain, Panel, RequireUser } from "../components/AppPage";
import { ChecklistWidget, GuideBlock, GuideCard, GuideHero, GuideNotFound, GuideSection, GuideTitle, JumpNav, NumberedSteps, PanelHeading, PrevNext, QuoteBox, SectionHeading } from "../components/GuideBlocks";
import { YEAR_TONES } from "../components/StudyKit";
import { plus } from "../site/siteContent";
import { ErrorMessage } from "../components/AppPage";
import { SetupSkeleton } from "../components/Skeleton";
import { useContent } from "../lib/content";

function Loading({ error }) {
  return error ? <ErrorMessage message={error} onRetry={() => window.location.reload()} /> : <SetupSkeleton label="Loading" />;
}

const isMissing = (error) => /doesn't exist|Not found/i.test(error || "");

// Colour icon per station (keyed by the station's icon name in the data file).
const STATION_ICONS = {
  HeartPulse: "anatomical-heart",
  Wind: "lungs",
  CircleDot: "microbe",
  PersonStanding: "person-standing",
  Bone: "bone",
  Milestone: "leg",
  Dumbbell: "flexed-biceps",
  Grip: "raised-hand",
  Brain: "brain",
  Hand: "raised-hand",
  Footprints: "foot",
  Compass: "person-walking",
  MessageCircle: "speaking-head",
  Eye: "eye",
  Ear: "ear",
  ScanFace: "nose",
  Activity: "drop-of-blood",
  Syringe: "foot",
  Waves: "brain",
};

// Category display order for the "By station" grid.
const CATEGORY_ORDER = ["Core", "Musculoskeletal", "Neurological", "Special senses & speech", "Advanced"];

const stationIcon = (name) => STATION_ICONS[name] || "stethoscope";
const CATEGORY_TONES = { Core: "coral", Musculoskeletal: "sky", Neurological: "violet", "Special senses & speech": "mint", Advanced: "sun" };

function StationMeta({ meta, order }) {
  if (!meta && !order) return null;
  return (
    <div className="mb-6 space-y-4">
      {meta && (meta.position || meta.exposure) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {meta.position && (
            <div className="rounded-2xl bg-s-tint/60 p-3.5 text-sm">
              <p className="font-chart text-xs text-s-mute">Position</p>
              <p className="mt-1 text-s-ink">{meta.position}</p>
            </div>
          )}
          {meta.exposure && (
            <div className="rounded-2xl bg-s-tint/60 p-3.5 text-sm">
              <p className="font-chart text-xs text-s-mute">Exposure</p>
              <p className="mt-1 text-s-ink">{meta.exposure}</p>
            </div>
          )}
        </div>
      )}
      {order && order.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-s-ink">Step-by-step order</p>
          <ol className="flex flex-wrap items-center gap-1.5">
            {order.map((step, index) => (
              <li key={index} className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-s-line bg-s-card py-1 pl-1 pr-3 text-xs font-medium text-s-ink">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-coral-soft font-chart text-[10px] text-s-miss" aria-hidden="true">{index + 1}</span>
                  {step}
                </span>
                {index < order.length - 1 && <ArrowRight size={12} strokeWidth={2} className="shrink-0 text-s-mute/60" aria-hidden="true" />}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export function ClinicalExamGuideHome() {
  const { data, error } = useContent("/guides/exam");
  if (!data) {
    return (
      <RequireUser active="clinical-exam">
        <PageMain><Loading error={error} /></PageMain>
      </RequireUser>
    );
  }
  const { universalOpening, coreMnemonic, mskFramework, masterQuickReference, presentationTemplate, finalChecklist } = data.meta;
  const stations = data.entries;
  return (
    <RequireUser active="clinical-exam">
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "Clinical Exam Guide" }]} />

        <GuideHero
          title="Clinical Exam Guide"
          description={`The step-by-step order, mnemonics and findings for ${plus(stations.length)} examination stations.`}
        />

        <JumpNav
          items={[
            { href: "#universal-opening", label: "Universal opening" },
            { href: "#core-mnemonic", label: "TOP RaCk" },
            { href: "#msk-framework", label: "Look, Feel, Move" },
            { href: "#by-station", label: "By station" },
            { href: "#master-reference", label: "Master reference" },
            { href: "#presentation-template", label: "Presentation template" },
            { href: "#final-checklist", label: "Final checklist" },
          ]}
        />

        <div className="grid gap-6">
          <Panel id="universal-opening" className="scroll-mt-24">
            <PanelHeading title={universalOpening.title} subtitle={universalOpening.subtitle} />
            <NumberedSteps steps={universalOpening.steps} />
            {universalOpening.note && <p className="mt-4 text-sm font-medium text-s-ink">{universalOpening.note}</p>}
          </Panel>

          <div id="core-mnemonic" className="grid scroll-mt-24 gap-5 lg:grid-cols-2">
            <Panel>
              <PanelHeading title={coreMnemonic.name} subtitle={coreMnemonic.subtitle} />
              <GuideBlock block={coreMnemonic} />
              {coreMnemonic.note && <p className="mt-4 text-sm font-medium text-s-ink">{coreMnemonic.note}</p>}
            </Panel>
            <Panel id="msk-framework" className="scroll-mt-24">
              <PanelHeading title={mskFramework.name} subtitle={mskFramework.subtitle} />
              <GuideBlock block={mskFramework} />
            </Panel>
          </div>

          <section id="by-station" className="scroll-mt-24">
            <SectionHeading description="Every examination station, grouped by category.">By station</SectionHeading>
            <div className="space-y-8">
              {CATEGORY_ORDER.map((category, categoryIndex) => {
                const categoryStations = stations.filter((station) => station.category === category);
                if (categoryStations.length === 0) return null;
                const tone = CATEGORY_TONES[category] || YEAR_TONES[categoryIndex % YEAR_TONES.length];
                return (
                  <div key={category}>
                    <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-s-ink">
                      {category}
                      <span className="rounded-full bg-s-tint px-2.5 py-0.5 font-chart text-xs font-normal text-s-mute">{categoryStations.length}</span>
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {categoryStations.map((station, i) => (
                        <GuideCard
                          key={station.slug}
                          to={`/clinical-examination/${station.slug}`}
                          icon={stationIcon(station.icon)}
                          tone={tone}
                          title={station.title}
                          summary={station.summary}
                          index={i}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <Panel id="master-reference" className="scroll-mt-24">
            <PanelHeading title={masterQuickReference.title} subtitle={masterQuickReference.subtitle} />
            <GuideBlock block={{ type: "table", ...masterQuickReference.table }} />
          </Panel>

          <Panel id="presentation-template" className="scroll-mt-24">
            <PanelHeading icon={ScrollText} title={presentationTemplate.title} subtitle={presentationTemplate.subtitle} />
            <QuoteBox>{presentationTemplate.text}</QuoteBox>
          </Panel>

          <ChecklistWidget
            id="final-checklist"
            title={finalChecklist.title}
            subtitle={finalChecklist.subtitle}
            items={finalChecklist.items}
            storageKey="kf_clinical_exam_final_checklist"
          />
        </div>
      </PageMain>
    </RequireUser>
  );
}

export function ClinicalExamGuideStation() {
  const { stationSlug } = useParams();
  const { data, error } = useContent(`/guides/exam/${encodeURIComponent(stationSlug)}`);
  const station = data?.entry;

  if (!data && !isMissing(error)) {
    return (
      <RequireUser active="clinical-exam">
        <PageMain width="reading"><Loading error={error} /></PageMain>
      </RequireUser>
    );
  }
  if (!station) {
    return (
      <RequireUser active="clinical-exam">
        <PageMain width="reading">
          <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "Clinical Exam Guide", to: "/clinical-examination" }, { label: "Not found" }]} />
          <GuideNotFound what="examination station" backTo="/clinical-examination" backLabel="Back to the guide" />
        </PageMain>
      </RequireUser>
    );
  }

  const { prev, next } = data;

  return (
    <RequireUser active="clinical-exam">
      <PageMain width="reading">
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "Clinical Exam Guide", to: "/clinical-examination" }, { label: station.title }]} />
        <GuideTitle icon={stationIcon(station.icon)} tone={CATEGORY_TONES[station.category] || "coral"} title={station.title} summary={station.summary} />
        <Panel className="site-rise" style={{ "--rise-delay": "80ms" }}>
          <StationMeta meta={station.meta} order={station.order} />
          {station.sections.map((section) => (
            <GuideSection key={section.heading} {...section} />
          ))}
        </Panel>
        <PrevNext prev={prev} next={next} base="/clinical-examination" allLabel="All stations" />
      </PageMain>
    </RequireUser>
  );
}
