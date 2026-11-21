// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to a simulated backend. Not shipped by the registry.
import * as fixtures from "./fixtures";
import { ContactSales } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function PricingContactSalesShowcasePage() {
  return <ContactSales customers={fixtures.customers} features={fixtures.features} onSubmit={() => wait(800)} />;
}
