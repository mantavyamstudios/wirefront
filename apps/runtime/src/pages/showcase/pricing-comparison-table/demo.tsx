// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the table with sample plans. Not shipped by the registry.
import * as fixtures from "./fixtures";
import { PlanComparison } from "./view";

export function PricingComparisonTableShowcasePage() {
  return <PlanComparison onChoose={() => {}} plans={fixtures.plans} sections={fixtures.sections} />;
}
