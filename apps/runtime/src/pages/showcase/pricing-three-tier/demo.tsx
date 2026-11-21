// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture plans and a simulated checkout.
// Not shipped by the registry; builders wire Pricing to their own billing.
import * as fixtures from "./fixtures";
import { Pricing } from "./view";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function demoChoose() {
  await wait(900);
}

export function PricingThreeTierShowcasePage() {
  return <Pricing onChoosePlan={demoChoose} plans={fixtures.listPlans} />;
}
