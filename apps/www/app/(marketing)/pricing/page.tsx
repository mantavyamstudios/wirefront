import type { Metadata } from "next";

import { PricingPage } from "@/components/pricing/pricing-page";
import { getPageAlternates, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Every Wirefront screen is free and open source under MIT. Book a call for custom work.",
  alternates: getPageAlternates("/pricing"),
  openGraph: {
    title: `Pricing — ${SITE_NAME}`,
    description: "Every Wirefront screen, free and open source under MIT.",
  },
};

const Page = () => <PricingPage />;

export default Page;
