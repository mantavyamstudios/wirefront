import type { Metadata } from "next";

import { PricingPage } from "@/components/pricing/pricing-page";
import { getPageAlternates, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Preview every Flutter flow live in your browser and read its full Dart source, free. Plus, with a commercial license, is coming soon.",
  alternates: getPageAlternates("/pricing"),
  openGraph: {
    title: `Pricing — ${SITE_NAME}`,
    description:
      "Preview every Flutter flow live and read its full Dart source, free.",
  },
};

export default function Page() {
  return <PricingPage />;
}
