// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the cards with sample plans. Not shipped by the registry.
import * as fixtures from "./fixtures";
import { PlanCards } from "./view";

export function CardPricingShowcasePage() {
  return <PlanCards onChoose={() => {}} plans={fixtures.listPlanTiers} />;
}
