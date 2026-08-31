import { HeroSection } from "./_components/HeroSection";
import { FeaturesSection } from "./_components/FeaturesGrid";
import { NpmPackageSection } from "./_components/CliGuideSection";
import { HowItWorksSection } from "./_components/HostedServiceBanner";
import { CtaBanner } from "./_components/CtaBanner";

export default function Home() {
  return (
    <div className="p-6 lg:p-8 w-full space-y-20">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <NpmPackageSection />
      <CtaBanner />
    </div>
  );
}
