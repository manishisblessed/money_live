import { HeroEditorial } from "@/components/home/HeroEditorial";
import { ServiceTicker } from "@/components/home/ServiceTicker";
import { EarningsCalculator } from "@/components/home/EarningsCalculator";
import { ServiceBento } from "@/components/home/ServiceBento";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ForEveryRole } from "@/components/home/ForEveryRole";
import { RetailerStories } from "@/components/home/RetailerStories";
import { BharatReach } from "@/components/home/BharatReach";
import { TrustWall } from "@/components/home/TrustWall";
import { PlansCompare } from "@/components/home/PlansCompare";
import { FaqSplit } from "@/components/home/FaqSplit";
import { InsightsPreview } from "@/components/home/InsightsPreview";
import { FinalCTA } from "@/components/home/FinalCTA";

export default function HomePage() {
  return (
    <>
      <HeroEditorial />
      <ServiceTicker />
      <EarningsCalculator />
      <ServiceBento />
      <HowItWorks />
      <ForEveryRole />
      <RetailerStories />
      <BharatReach />
      <TrustWall />
      <PlansCompare />
      <FaqSplit />
      <InsightsPreview />
      <FinalCTA />
    </>
  );
}
