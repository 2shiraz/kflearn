import Navbar from "./Navbar";
import Footer from "./Footer";

export default function PageShell({ children }) {
  return (
    <div className="app-gradient-bg min-h-screen">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
