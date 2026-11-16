// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the list with sample integrations. Not shipped by the registry.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import * as fixtures from "./fixtures";
import { ConnectedServices } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const demoNow = () => new Date(fixtures.now);

export function CardIntegrationShowcasePage() {
  return (
    <WirefrontProvider now={demoNow}>
      <ConnectedServices browseHref="#integrations" configureHref={(s) => `#${s.id}`} onToggle={() => wait(500)} services={fixtures.listConnectedServices} />
    </WirefrontProvider>
  );
}
