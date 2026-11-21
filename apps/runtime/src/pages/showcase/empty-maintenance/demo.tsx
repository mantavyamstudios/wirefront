// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the empty state in sample page chrome. Not shipped by the registry.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import * as fixtures from "./fixtures";
import { Maintenance } from "./view";

const demoNow = () => new Date(fixtures.now);
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function EmptyMaintenanceShowcasePage() {
  return (
    <WirefrontProvider now={demoNow}>
      <Maintenance {...fixtures.getMaintenance} onSubscribe={() => wait(600)} statusHref="https://status.example.com" />
    </WirefrontProvider>
  );
}
