import Image from "next/image";
import Link from "next/link";
import { Button } from "@/src/components/ui";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import ToolsSection from "../components/ToolsSection";
import NoDownloadsSection from "../components/NoDownloadsSection";
import TestimonialsSection from "../components/TestimonialsSection";
import DashboardSection from "../components/DashboardSection";
import FAQSection from "../components/FAQSection";



export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <HeroSection />
      <ToolsSection />
      <NoDownloadsSection />
      <TestimonialsSection />
      <DashboardSection />
      <FAQSection />
     <Footer />
    </main>
  );
}





/* -------------------------------------------------------------------------- */


/* -------------------------------------------------------------------------- */
/*  SECTION: FAQ / SUPPORT                                                    */
/* -------------------------------------------------------------------------- */

