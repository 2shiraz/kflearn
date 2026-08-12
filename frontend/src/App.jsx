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
          <Route path="/signin" element={<SigninPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/stations" element={<ComingSoonPage sectionKey="stations" title="OSCE Stations" />} />
          <Route path="/history-taking" element={<ComingSoonPage sectionKey="history" title="History Taking" />} />
          <Route path="/clinical-examination" element={<ComingSoonPage sectionKey="clinical-exam" title="Clinical Examination" />} />
          <Route path="/handout-notes" element={<ComingSoonPage sectionKey="handouts" title="Handout Notes" />} />
          <Route path="/progress" element={<ComingSoonPage sectionKey="progress" title="Progress" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
