import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import StatsBar from "./components/StatsBar";
import SigninPage from "./pages/SigninPage";

function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <StatsBar />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SigninPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
