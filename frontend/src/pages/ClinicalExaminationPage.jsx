import { Link, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Brain,
  CircleDot,
  Compass,
  Ear,
  Eye,
  Footprints,
  Hand,
  HeartPulse,
  ListChecks,
  MessageCircle,
  ScanFace,
  ScrollText,
  Wind,
} from "lucide-react";
import { Breadcrumbs, ErrorMessage, PageMain, Panel, RequireUser } from "../components/AppPage";
import { ChecklistWidget, GuideBlock, GuideSection, JumpNav } from "../components/GuideBlocks";
import {
  coreMnemonic,
  finalChecklist,
  getAdjacentStations,
  getStation,
  masterQuickReference,
  presentationTemplate,
  stations,
  universalOpening,
} from "../data/clinicalExaminationGuide";

const STATION_ICONS = { HeartPulse, Wind, CircleDot, Brain, Hand, Footprints, Compass, MessageCircle, Eye, Ear, ScanFace, Activity };

function StationIcon({ name, ...props }) {
  const Icon = STATION_ICONS[name] || ScrollText;
  return <Icon {...props} />;
}

function StationMeta({ meta, order }) {
  if (!meta && !order) return null;
  return (
    <div className="mb-5 space-y-3">
      {meta && (meta.position || meta.exposure) && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg border border-line bg-white/60 p-3 text-sm">
          {meta.position && <span><span className="font-semibold text-ink">Position:</span> <span className="text-ink-soft">{meta.position}</span></span>}
          {meta.exposure && <span><span className="font-semibold text-ink">Exposure:</span> <span className="text-ink-soft">{meta.exposure}</span></span>}
        </div>
      )}
      {order && order.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink-soft">Step-by-step order</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {order.map((step, index) => (
              <span key={index} className="flex items-center gap-1.5">
                <span className="glass-surface rounded-lg px-2.5 py-1 text-xs font-semibold text-ink">{step}</span>
                {index < order.length - 1 && <ArrowRight size={11} className="shrink-0 text-ink-soft/60" />}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ClinicalExamGuideHome() {
  return (
    <RequireUser active="clinical-exam">
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "Clinical Examination Guide" }]} />

        <div className="mb-6">
          <p className="text-sm font-semibold text-ink-soft">Static reference</p>
          <h1 className="mt-1 text-4xl font-extrabold text-ink">Clinical Examination Guide</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            The step-by-step order, mnemonics, and findings for all twelve OSCE examination stations.
          </p>
        </div>

        <JumpNav
          items={[
            { href: "#universal-opening", label: "Universal opening" },
            { href: "#core-mnemonic", label: "TOP RaCk" },
            { href: "#by-station", label: "By station" },
            { href: "#master-reference", label: "Master reference" },
            { href: "#presentation-template", label: "Presentation template" },
            { href: "#final-checklist", label: "Final checklist" },
          ]}
        />

        <div className="grid gap-5">
          <Panel id="universal-opening">
            <h2 className="text-lg font-bold text-ink">{universalOpening.title}</h2>
            <p className="text-sm text-ink-soft">{universalOpening.subtitle}</p>
            <ol className="mt-3 space-y-2">
              {universalOpening.steps.map((step, index) => (
                <li key={step.label} className="flex gap-3 rounded-lg border border-line bg-white/80 p-3 text-sm">
                  <span className="gradient-brand flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white">{index + 1}</span>
                  <span>
                    <span className="font-semibold text-ink">{step.label}</span>
                    {step.detail && <> — <span className="text-ink-soft">{step.detail}</span></>}
                  </span>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel id="core-mnemonic">
            <h2 className="font-display text-xl font-extrabold text-ink">{coreMnemonic.name}</h2>
            <p className="text-sm text-ink-soft">{coreMnemonic.subtitle}</p>
            <GuideBlock block={coreMnemonic} />
            {coreMnemonic.note && <p className="mt-3 text-sm font-medium text-ink">{coreMnemonic.note}</p>}
          </Panel>

          <div id="by-station">
            <h2 className="mb-1 text-lg font-bold text-ink">By station</h2>
            <p className="mb-3 text-sm text-ink-soft">All twelve examination stations, in order.</p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {stations.map((station) => (
                <Link key={station.slug} to={`/clinical-examination/${station.slug}`} className="gradient-card group block rounded-lg p-5">
                  <span className="gradient-icon flex h-11 w-11 items-center justify-center rounded-lg text-ink">
                    <StationIcon name={station.icon} size={20} />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-extrabold text-ink">{station.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{station.summary}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ink group-hover:underline">
                    Read guide <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <Panel id="master-reference">
            <h2 className="text-lg font-bold text-ink">{masterQuickReference.title}</h2>
            <p className="text-sm text-ink-soft">{masterQuickReference.subtitle}</p>
            <GuideBlock block={{ type: "table", ...masterQuickReference.table }} />
          </Panel>

          <Panel id="presentation-template">
            <div className="flex items-center gap-2">
              <ScrollText size={18} className="text-ink-soft" />
              <h2 className="text-lg font-bold text-ink">{presentationTemplate.title}</h2>
            </div>
            <p className="text-sm text-ink-soft">{presentationTemplate.subtitle}</p>
            <p className="mt-3 rounded-lg border border-line bg-white/60 p-4 text-sm italic leading-relaxed text-ink-soft">{presentationTemplate.text}</p>
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
  const station = getStation(stationSlug);

  if (!station) {
    return (
      <RequireUser active="clinical-exam">
        <PageMain>
          <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "Clinical Examination Guide", to: "/clinical-examination" }, { label: "Not found" }]} />
          <ErrorMessage message="That examination station doesn't exist." />
          <Link to="/clinical-examination" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:underline">
            <ArrowLeft size={14} /> Back to the guide
          </Link>
        </PageMain>
      </RequireUser>
    );
  }

  const { prev, next } = getAdjacentStations(stationSlug);

  return (
    <RequireUser active="clinical-exam">
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "Clinical Examination Guide", to: "/clinical-examination" }, { label: station.title }]} />

        <div className="mb-6 flex items-start gap-4">
          <span className="gradient-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-ink">
            <StationIcon name={station.icon} size={26} />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold text-ink">{station.title}</h1>
            <p className="mt-1 max-w-2xl text-ink-soft">{station.summary}</p>
          </div>
        </div>

        <Panel>
          <StationMeta meta={station.meta} order={station.order} />
          {station.sections.map((section) => (
            <GuideSection key={section.heading} {...section} />
          ))}
        </Panel>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          {prev ? (
            <Link to={`/clinical-examination/${prev.slug}`} className="glass-surface inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-ink">
              <ArrowLeft size={14} /> {prev.title}
            </Link>
          ) : <span />}
          <Link to="/clinical-examination" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
            <ListChecks size={14} /> All stations
          </Link>
          {next ? (
            <Link to={`/clinical-examination/${next.slug}`} className="glass-surface inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-ink">
              {next.title} <ArrowRight size={14} />
            </Link>
          ) : <span />}
        </div>
      </PageMain>
    </RequireUser>
  );
}
