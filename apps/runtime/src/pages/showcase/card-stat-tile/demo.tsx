// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the tiles with sample data. Not shipped by the registry.
import * as fixtures from "./fixtures";
import { KpiOverview } from "./view";

export function CardStatTileShowcasePage() {
  return <KpiOverview kpis={fixtures.listKpis} periodLabel="Apr 2026" />;
}
