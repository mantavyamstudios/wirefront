// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the list with sample events. Not shipped by the registry.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import * as fixtures from "./fixtures";
import { UpcomingEvents } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const demoNow = () => new Date(fixtures.now);

export function CardEventShowcasePage() {
  return (
    <WirefrontProvider now={demoNow} timeZone="UTC">
      <UpcomingEvents events={fixtures.listUpcomingEvents} onRsvp={() => wait(500)} />
    </WirefrontProvider>
  );
}
