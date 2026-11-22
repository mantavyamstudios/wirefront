// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the page with the sample plan. Not shipped by the registry.
import * as fixtures from "./fixtures";
import { SinglePlanPricing } from "./view";

export function PricingSimpleCardShowcasePage() {
  return (
    <SinglePlanPricing
      contactHref="#contact"
      onStart={() => {}}
      plan={fixtures.getPlan}
    />
  );
}
