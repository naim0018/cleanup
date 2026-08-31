import React from "react";
import { HeroSection } from "./_components/HeroSection";
import { FeaturesGrid } from "./_components/FeaturesGrid";
import { CliGuideSection } from "./_components/CliGuideSection";
import { HostedServiceBanner } from "./_components/HostedServiceBanner";

export default function Home() {
  return (
    <div className="p-6 lg:p-8 w-full flex flex-col gap-8 items-center">
      <div className="w-full space-y-8">
        {/* Main Hero Banner */}
        <HeroSection />

        {/* Core Capabilities & Features */}
        <FeaturesGrid />

        {/* CLI & NPM Package Guide */}
        <CliGuideSection />

        {/* Hosted Service Banner */}
        <HostedServiceBanner />
      </div>
    </div>
  );
}
