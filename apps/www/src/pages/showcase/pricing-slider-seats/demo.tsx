// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the calculator with the sample plan. Not shipped by the registry.
import * as fixtures from "./fixtures";
import { SeatPricing } from "./view";

export function PricingSliderSeatsShowcasePage() {
  return <SeatPricing onContinue={() => {}} plan={fixtures.getSeatPlan} />;
}
