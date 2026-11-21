import type { Metadata } from "next";

import { PRIVACY_POLICY_ITEMS } from "@/components/legal/legal-data";
import { LegalScrollView } from "@/components/legal/legal-scroll-view";
import { getPageAlternates } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What Enterprise UI Playground collects (aggregated analytics only), what it does not, and the services the flows use.",
  alternates: getPageAlternates("/legal/privacy"),
};

export default function LegalPrivacyPage() {
  return (
    <LegalScrollView
      lastUpdated="November 20, 2026"
      terms={PRIVACY_POLICY_ITEMS}
      title="Privacy Policy"
    />
  );
}
