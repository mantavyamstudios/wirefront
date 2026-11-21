import { Hero } from "@/components/hero";
import { InfoSection } from "@/components/info-section";
import { SponsorSection } from "@/components/sponsor-section";

const HomePage = () => (
  <div className="home-layout home-content body">
    <main className="main" data-page="home" data-page-theme="light">
      <Hero />
      <InfoSection />
      <SponsorSection />
    </main>
  </div>
);

export default HomePage;
