// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the page with sample plans. Not shipped by the registry.
import * as fixtures from "./fixtures";
import { BillingPeriodPricing } from "./view";

export function PricingMonthlyYearlyShowcasePage() {
  return <BillingPeriodPricing onChoose={() => {}} plans={fixtures.listBillingPlans} />;
}
