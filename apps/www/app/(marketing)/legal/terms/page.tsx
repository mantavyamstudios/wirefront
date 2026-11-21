import type { Metadata } from "next";

import { TERMS_OF_SERVICE_ITEMS } from "@/components/legal/legal-data";
import { LegalScrollView } from "@/components/legal/legal-scroll-view";
import { getPageAlternates } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The ground rules for using Wirefront and its UI screens.",
  alternates: getPageAlternates("/legal/terms"),
};

const LegalTermsPage = () => (
  <LegalScrollView
    lastUpdated="November 20, 2026"
    terms={TERMS_OF_SERVICE_ITEMS}
    title="Terms of Service"
  />
);

export default LegalTermsPage;
