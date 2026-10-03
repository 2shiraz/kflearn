import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import BrandMark from "./components/BrandMark";
// Every route except the landing page is code-split: its page (and any static
// content it imports) downloads only when the route is first visited.
// After a redeploy, a tab opened earlier may request chunk files that no longer
// exist; reload once to pick up the new build instead of showing a blank page.
const RELOAD_KEY = "kf_chunk_reload";
const lazyPage = (load, name = "default") => lazy(() => load().then(
  (m) => {
    try { sessionStorage.removeItem(RELOAD_KEY); } catch { /* storage unavailable */ }
    return { default: m[name] };
  },
  (error) => {
    let reloaded = true;
    try {
      reloaded = sessionStorage.getItem(RELOAD_KEY) === "1";
      if (!reloaded) sessionStorage.setItem(RELOAD_KEY, "1");
    } catch { /* storage unavailable */ }
    if (reloaded) throw error;
    window.location.reload();
    return new Promise(() => {});
  },
));

const SigninPage = lazyPage(() => import("./pages/SigninPage"));
const SignupPage = lazyPage(() => import("./pages/SignupPage"));
const DashboardPage = lazyPage(() => import("./pages/DashboardPage"));
const NotFoundPage = lazyPage(() => import("./pages/NotFoundPage"));
const SettingsPage = lazyPage(() => import("./pages/SettingsPage"));
const ProgressPage = lazyPage(() => import("./pages/ProgressPage"));
const FeaturesPage = lazyPage(() => import("./pages/FeaturesPage"));
const SampleStationsPage = lazyPage(() => import("./pages/SampleStationsPage"));
const PricingPage = lazyPage(() => import("./pages/PricingPage"));
const AboutPage = lazyPage(() => import("./pages/AboutPage"));
const CreditsPage = lazyPage(() => import("./pages/CreditsPage"));

const osce = () => import("./pages/OsceStationsPage");
const AdminOscePage = lazyPage(osce, "AdminOscePage");
const OsceAttemptHistoryPage = lazyPage(osce, "OsceAttemptHistoryPage");
const OsceHome = lazyPage(osce, "OsceHome");
const OsceStationDetail = lazyPage(osce, "OsceStationDetail");
const OsceResultPage = lazyPage(osce, "OsceResultPage");
const OsceSectionPage = lazyPage(osce, "OsceSectionPage");
const SelfAssessmentPage = lazyPage(osce, "SelfAssessmentPage");
const SinglePlayerOsce = lazyPage(osce, "SinglePlayerOsce");
const VirtualPatientSession = lazyPage(osce, "VirtualPatientSession");

const historyGuide = () => import("./pages/HistoryGuidePage");
const HistoryGuideHome = lazyPage(historyGuide, "HistoryGuideHome");
const HistoryGuideTopic = lazyPage(historyGuide, "HistoryGuideTopic");

const mcqs = () => import("./pages/McqsPage");
const McqsHome = lazyPage(mcqs, "McqsHome");
const McqYearPage = lazyPage(mcqs, "McqYearPage");
const McqPractice = lazyPage(mcqs, "McqPractice");
const McqRead = lazyPage(() => import("./pages/McqReadPage"), "McqRead");

const ospe = () => import("./pages/OspePage");
const OspeHome = lazyPage(ospe, "OspeHome");
const OspeYearPage = lazyPage(ospe, "OspeYearPage");
const OspeRead = lazyPage(ospe, "OspeRead");
const OspePractice = lazyPage(ospe, "OspePractice");

const clinicalExam = () => import("./pages/ClinicalExaminationPage");
const ClinicalExamGuideHome = lazyPage(clinicalExam, "ClinicalExamGuideHome");
const ClinicalExamGuideStation = lazyPage(clinicalExam, "ClinicalExamGuideStation");

const handouts = () => import("./pages/HandoutNotesPage");
const HandoutNotesHome = lazyPage(handouts, "HandoutNotesHome");
const HandoutNotesDetail = lazyPage(handouts, "HandoutNotesDetail");

function RouteFallback() {
  return (
    <div className="site flex min-h-dvh items-center justify-center" role="status">
      <span className="bob"><BrandMark size={44} /></span>
      <span className="sr-only">Loading</span>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-dvh">
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/sample-stations" element={<SampleStationsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/signin" element={<SigninPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/stations" element={<OsceHome />} />
          <Route path="/stations/section/:sectionName" element={<OsceSectionPage />} />
          <Route path="/stations/:slug" element={<OsceStationDetail />} />
          <Route path="/stations/:slug/single-player" element={<SinglePlayerOsce />} />
          <Route path="/stations/attempts" element={<OsceAttemptHistoryPage />} />
          <Route path="/stations/attempts/:attemptId/session" element={<VirtualPatientSession />} />
          <Route path="/stations/attempts/:attemptId/self-assessment" element={<SelfAssessmentPage />} />
          <Route path="/stations/attempts/:attemptId/ai-assessment" element={<SelfAssessmentPage />} />
          <Route path="/stations/attempts/:attemptId/results" element={<OsceResultPage />} />
          <Route path="/admin/:tab?" element={<AdminOscePage />} />
          <Route path="/history-taking" element={<HistoryGuideHome />} />
          <Route path="/history-taking/:topicSlug" element={<HistoryGuideTopic />} />
          <Route path="/clinical-examination" element={<ClinicalExamGuideHome />} />
          <Route path="/clinical-examination/:stationSlug" element={<ClinicalExamGuideStation />} />
          <Route path="/mcqs" element={<McqsHome />} />
          <Route path="/mcqs/:yearSlug" element={<McqYearPage />} />
          <Route path="/mcqs/:yearSlug/read" element={<McqRead />} />
          <Route path="/mcqs/:yearSlug/practice" element={<McqPractice />} />
          <Route path="/ospe" element={<OspeHome />} />
          <Route path="/ospe/:yearSlug" element={<OspeYearPage />} />
          <Route path="/ospe/:yearSlug/read" element={<OspeRead />} />
          <Route path="/ospe/:yearSlug/practice" element={<OspePractice />} />
          <Route path="/handout-notes" element={<HandoutNotesHome />} />
          <Route path="/handout-notes/:slug" element={<HandoutNotesDetail />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/credits" element={<CreditsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}
