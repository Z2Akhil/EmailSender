import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";

import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Integrations from "@/components/landing/Integrations";
import DarkFeatures from "@/components/landing/DarkFeatures";
import Testimonials from "@/components/landing/Testimonials";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />

      <Features />
      <HowItWorks />
      <Integrations />
      <DarkFeatures />
      <Testimonials />
      <Pricing />
      <Footer />
    </div>
  );
}
