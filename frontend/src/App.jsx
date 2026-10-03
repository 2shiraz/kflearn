import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import StatsBar from "./components/StatsBar";
import HowItWorks from "./components/HowItWorks";
import FeatureGrid from "./components/FeatureGrid";
import FAQ from "./components/FAQ";
import Disclaimer from "./components/Disclaimer";
import Footer from "./components/Footer";
import SigninPage from "./pages/SigninPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import NotFoundPage from "./pages/NotFoundPage";
import SettingsPage from "./pages/SettingsPage";
import FeaturesPage from "./pages/FeaturesPage";
import SampleStationsPage from "./pages/SampleStationsPage";
import PricingPage from "./pages/PricingPage";
import AboutPage from "./pages/AboutPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import WhatYouGetPage from "./pages/WhatYouGetPage";
import {
  AdminOscePage,
  OsceAttemptHistoryPage,
  OsceHome,
  OsceStationDetail,
  OsceResultPage,
  OsceSectionPage,
  SelfAssessmentPage,
  SinglePlayerOsce,
  VirtualPatientSession,
} from "./pages/OsceStationsPage";
import { HistoryGuideHome, HistoryGuideTopic } from "./pages/HistoryGuidePage";
import { McqPractice, McqsHome, McqYearPage } from "./pages/McqsPage";
import { McqRead } from "./pages/McqReadPage";
import { ClinicalExamGuideHome, ClinicalExamGuideStation } from "./pages/ClinicalExaminationPage";
import { HandoutNotesDetail, HandoutNotesHome } from "./pages/HandoutNotesPage";
import CreditsPage from "./pages/CreditsPage";

function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <StatsBar />
      <HowItWorks />
      <FeatureGrid />
      <FAQ />
      <Disclaimer />
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-gradient-bg min-h-screen">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/sample-stations" element={<SampleStationsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/what-you-get" element={<WhatYouGetPage />} />
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
          <Route path="/admin/stations" element={<AdminOscePage />} />
          <Route path="/history-taking" element={<HistoryGuideHome />} />
          <Route path="/history-taking/:topicSlug" element={<HistoryGuideTopic />} />
          <Route path="/clinical-examination" element={<ClinicalExamGuideHome />} />
          <Route path="/clinical-examination/:stationSlug" element={<ClinicalExamGuideStation />} />
          <Route path="/mcqs" element={<McqsHome />} />
          <Route path="/mcqs/:yearSlug" element={<McqYearPage />} />
          <Route path="/mcqs/:yearSlug/read" element={<McqRead />} />
          <Route path="/mcqs/:yearSlug/practice" element={<McqPractice />} />
          <Route path="/handout-notes" element={<HandoutNotesHome />} />
          <Route path="/handout-notes/:slug" element={<HandoutNotesDetail />} />
          <Route path="/progress" element={<ComingSoonPage sectionKey="progress" title="Progress" />} />
          <Route path="/credits" element={<CreditsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
