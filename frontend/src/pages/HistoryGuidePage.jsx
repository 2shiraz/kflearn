import { useParams } from "react-router-dom";
import { MessageCircle, ScrollText } from "lucide-react";
import { Breadcrumbs, PageMain, Panel, RequireUser } from "../components/AppPage";
import { ChecklistWidget, ExamTips, GuideBlock, GuideCard, GuideHero, GuideNotFound, GuideSection, GuideTitle, JumpNav, NumberedSteps, PanelHeading, PrevNext, QuoteBox, SectionHeading } from "../components/GuideBlocks";
import { YEAR_TONES } from "../components/StudyKit";
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

// Colour icon per topic (keyed by the topic's icon name in the data file).
const TOPIC_ICONS = {
  Bone: "bone",
  HeartPulse: "anatomical-heart",
  Wind: "lungs",
  Zap: "face-with-spiral-eyes",
  Brain: "brain",
  Scissors: "scissors",
  Droplet: "drop-of-blood",
  CircleDot: "microbe",
  Ribbon: "reminder-ribbon",
};

export function HistoryGuideHome() {
  return (
    <RequireUser active="history">
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "History Taking Guide" }]} />

        <GuideHero
          title="History Taking Guide"
          description="The mnemonics, question sets and differentials to run a focused history in any station."
        />

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

        <div className="grid gap-6">
          <Panel id="universal-opening" className="scroll-mt-24">
            <PanelHeading title={universalOpening.title} subtitle={universalOpening.subtitle} />
            <p className="mt-3 text-sm leading-relaxed text-s-mute">{universalOpening.intro}</p>
            <NumberedSteps steps={universalOpening.steps} />
            <ExamTips tips={[universalOpening.closing]} />
          </Panel>

          <section id="core-mnemonics" className="scroll-mt-24">
            <SectionHeading description="These three appear in every station. Learn them first.">Core mnemonics</SectionHeading>
            <div className="grid gap-5">
              {coreMnemonics.map((mnemonic) => (
                <Panel key={mnemonic.id}>
                  <PanelHeading title={mnemonic.name} subtitle={mnemonic.subtitle} />
                  <GuideBlock block={mnemonic} />
                </Panel>
              ))}
            </div>
          </section>

          <Panel id="general-approach" className="scroll-mt-24">
            <PanelHeading title={generalApproach.title} subtitle={generalApproach.subtitle} />
            <div className="mt-5">
              {generalApproach.sections.map((section) => (
                <GuideSection key={section.heading} {...section} />
              ))}
            </div>
            <ExamTips tips={[generalApproach.examTip]} />
          </Panel>

          <section id="by-presentation" className="scroll-mt-24">
            <SectionHeading description="Station-specific extras on top of the core mnemonics above.">By presenting complaint</SectionHeading>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {topics.map((topic, i) => (
                <GuideCard
                  key={topic.slug}
                  to={`/history-taking/${topic.slug}`}
                  icon={TOPIC_ICONS[topic.icon] || "clipboard"}
                  tone={YEAR_TONES[i % YEAR_TONES.length]}
                  title={topic.title}
                  summary={topic.summary}
                  index={i}
                />
              ))}
            </div>
          </section>

          <Panel id="communication-skills" className="scroll-mt-24">
            <PanelHeading icon={MessageCircle} title={communicationSkills.title} subtitle={communicationSkills.subtitle} />
            <GuideBlock block={{ type: "table", ...communicationSkills.table }} />
            <div className="mt-5">
              <p className="text-sm font-medium text-s-ink">{communicationSkills.signposting.heading}</p>
              <p className="mt-1 text-sm text-s-mute">{communicationSkills.signposting.intro}</p>
              <QuoteBox>&ldquo;{communicationSkills.signposting.quote}&rdquo;</QuoteBox>
            </div>
          </Panel>

          <Panel id="presentation-template" className="scroll-mt-24">
            <PanelHeading icon={ScrollText} title={presentationTemplate.title} />
            <QuoteBox>{presentationTemplate.text}</QuoteBox>
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
        <PageMain width="reading">
          <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "History Taking Guide", to: "/history-taking" }, { label: "Not found" }]} />
          <GuideNotFound what="guide topic" backTo="/history-taking" backLabel="Back to the guide" />
        </PageMain>
      </RequireUser>
    );
  }

  const { prev, next } = getAdjacentTopics(topicSlug);

  return (
    <RequireUser active="history">
      <PageMain width="reading">
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "History Taking Guide", to: "/history-taking" }, { label: topic.title }]} />
        <GuideTitle icon={TOPIC_ICONS[topic.icon] || "clipboard"} tone="sun" title={topic.title} summary={topic.summary} />
        <Panel className="site-rise" style={{ "--rise-delay": "80ms" }}>
          {topic.sections.map((section) => (
            <GuideSection key={section.heading} {...section} />
          ))}
          <ExamTips tips={topic.examTips} />
        </Panel>
        <PrevNext prev={prev} next={next} base="/history-taking" allLabel="All topics" />
      </PageMain>
    </RequireUser>
  );
}
