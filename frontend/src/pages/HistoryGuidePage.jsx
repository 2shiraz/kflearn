import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bone,
  Brain,
  CircleDot,
  Droplet,
  HeartPulse,
  ListChecks,
  MessageCircle,
  Ribbon,
  Scissors,
  ScrollText,
  Wind,
  Zap,
} from "lucide-react";
import { Breadcrumbs, ErrorMessage, PageMain, Panel, RequireUser } from "../components/AppPage";
import { ChecklistWidget, ExamTips, GuideBlock, GuideSection, JumpNav } from "../components/GuideBlocks";
import {
  communicationSkills,
  coreMnemonics,
  generalApproach,
  getAdjacentTopics,
  getTopic,
  masterChecklist,
  presentationTemplate,
  topics,
  universalOpening,
} from "../data/historyTakingGuide";

const TOPIC_ICONS = { Bone, HeartPulse, Wind, Zap, Brain, Scissors, Droplet, CircleDot, Ribbon };

function TopicIcon({ name, ...props }) {
  const Icon = TOPIC_ICONS[name] || ScrollText;
  return <Icon {...props} />;
}

export function HistoryGuideHome() {
  return (
    <RequireUser active="history">
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "History Taking Guide" }]} />

        <div className="mb-6">
          <p className="text-sm font-semibold text-ink-soft">Static reference</p>
          <h1 className="mt-1 text-4xl font-extrabold text-ink">History Taking Guide</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            The mnemonics, question sets, and differentials to run a focused history in any OSCE station.
          </p>
        </div>

        <JumpNav
          items={[
            { href: "#universal-opening", label: "Universal opening" },
            { href: "#core-mnemonics", label: "Core mnemonics" },
            { href: "#general-approach", label: "General approach" },
            { href: "#by-presentation", label: "By presenting complaint" },
            { href: "#communication-skills", label: "Communication skills" },
            { href: "#presentation-template", label: "Presentation template" },
            { href: "#master-checklist", label: "Master checklist" },
          ]}
        />

        <div className="grid gap-5">
          <Panel id="universal-opening">
            <h2 className="text-lg font-bold text-ink">{universalOpening.title}</h2>
            <p className="text-sm text-ink-soft">{universalOpening.subtitle}</p>
            <p className="mt-3 text-sm text-ink-soft">{universalOpening.intro}</p>
            <ol className="mt-3 space-y-2">
              {universalOpening.steps.map((step, index) => (
                <li key={step.label} className="flex gap-3 rounded-lg border border-line bg-white/80 p-3 text-sm">
                  <span className="gradient-brand flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white">{index + 1}</span>
                  <span><span className="font-semibold text-ink">{step.label}</span> — <span className="text-ink-soft">{step.detail}</span></span>
                </li>
              ))}
            </ol>
            <ExamTips tips={[universalOpening.closing]} />
          </Panel>

          <div id="core-mnemonics">
            <h2 className="mb-3 text-lg font-bold text-ink">Core mnemonics</h2>
            <p className="mb-3 -mt-2 text-sm text-ink-soft">These three appear in every single station — memorise them first.</p>
            <div className="grid gap-5">
              {coreMnemonics.map((mnemonic) => (
                <Panel key={mnemonic.id}>
                  <h3 className="font-display text-xl font-extrabold text-ink">{mnemonic.name}</h3>
                  <p className="text-sm text-ink-soft">{mnemonic.subtitle}</p>
                  <GuideBlock block={mnemonic} />
                </Panel>
              ))}
            </div>
          </div>

          <Panel id="general-approach">
            <h2 className="text-lg font-bold text-ink">{generalApproach.title}</h2>
            <p className="text-sm text-ink-soft">{generalApproach.subtitle}</p>
            {generalApproach.sections.map((section) => (
              <GuideSection key={section.heading} {...section} />
            ))}
            <ExamTips tips={[generalApproach.examTip]} />
          </Panel>

          <div id="by-presentation">
            <h2 className="mb-1 text-lg font-bold text-ink">By presenting complaint</h2>
            <p className="mb-3 text-sm text-ink-soft">Station-specific extras on top of the core mnemonics above.</p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {topics.map((topic) => (
                <Link key={topic.slug} to={`/history-taking/${topic.slug}`} className="gradient-card group block rounded-lg p-5">
                  <span className="gradient-icon flex h-11 w-11 items-center justify-center rounded-lg text-ink">
                    <TopicIcon name={topic.icon} size={20} />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-extrabold text-ink">{topic.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{topic.summary}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ink group-hover:underline">
                    Read guide <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <Panel id="communication-skills">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} className="text-ink-soft" />
              <h2 className="text-lg font-bold text-ink">{communicationSkills.title}</h2>
            </div>
            <p className="text-sm text-ink-soft">{communicationSkills.subtitle}</p>
            <GuideBlock block={{ type: "table", ...communicationSkills.table }} />
            <div className="mt-4 rounded-lg border border-line bg-white/60 p-3">
              <p className="text-sm font-bold text-ink">{communicationSkills.signposting.heading}</p>
              <p className="mt-1 text-sm text-ink-soft">{communicationSkills.signposting.intro}</p>
              <p className="mt-2 text-sm italic text-ink">"{communicationSkills.signposting.quote}"</p>
            </div>
          </Panel>

          <Panel id="presentation-template">
            <div className="flex items-center gap-2">
              <ScrollText size={18} className="text-ink-soft" />
              <h2 className="text-lg font-bold text-ink">{presentationTemplate.title}</h2>
            </div>
            <p className="mt-3 rounded-lg border border-line bg-white/60 p-4 text-sm italic leading-relaxed text-ink-soft">{presentationTemplate.text}</p>
          </Panel>

          <ChecklistWidget
            id="master-checklist"
            title={masterChecklist.title}
            subtitle={masterChecklist.subtitle}
            items={masterChecklist.items}
            storageKey="kf_guide_master_checklist"
          />
        </div>
      </PageMain>
    </RequireUser>
  );
}

export function HistoryGuideTopic() {
  const { topicSlug } = useParams();
  const topic = getTopic(topicSlug);

  if (!topic) {
    return (
      <RequireUser active="history">
        <PageMain>
          <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "History Taking Guide", to: "/history-taking" }, { label: "Not found" }]} />
          <ErrorMessage message="That guide topic doesn't exist." />
          <Link to="/history-taking" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:underline">
            <ArrowLeft size={14} /> Back to the guide
          </Link>
        </PageMain>
      </RequireUser>
    );
  }

  const { prev, next } = getAdjacentTopics(topicSlug);

  return (
    <RequireUser active="history">
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "History Taking Guide", to: "/history-taking" }, { label: topic.title }]} />

        <div className="mb-6 flex items-start gap-4">
          <span className="gradient-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-ink">
            <TopicIcon name={topic.icon} size={26} />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold text-ink">{topic.title}</h1>
            <p className="mt-1 max-w-2xl text-ink-soft">{topic.summary}</p>
          </div>
        </div>

        <Panel>
          {topic.sections.map((section) => (
            <GuideSection key={section.heading} {...section} />
          ))}
          <ExamTips tips={topic.examTips} />
        </Panel>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          {prev ? (
            <Link to={`/history-taking/${prev.slug}`} className="glass-surface inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-ink">
              <ArrowLeft size={14} /> {prev.title}
            </Link>
          ) : <span />}
          <Link to="/history-taking" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
            <ListChecks size={14} /> All topics
          </Link>
          {next ? (
            <Link to={`/history-taking/${next.slug}`} className="glass-surface inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-ink">
              {next.title} <ArrowRight size={14} />
            </Link>
          ) : <span />}
        </div>
      </PageMain>
    </RequireUser>
  );
}
