// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: a seeded sample year; searching waits and then reports no such user.
// Not shipped by the registry; builders load contributions from their own backend.
import { fail } from "@wirefront/ui/wirefront/types";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { ContributionHeatmap } from "./view";

const demoNow = () => new Date(fixtures.now);
const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function CalendarsYearHeatmapShowcasePage() {
  const state = useShowcaseState();
  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <ContributionHeatmap
        data={
          state === "loading" || state === "error"
            ? undefined
            : fixtures.getContributions
        }
        error="Contributions didn’t load. Check your connection and try again."
        onRetry={() => {}}
        onSearch={async (login) => {
          await wait(600);
          if (login !== fixtures.getContributions.profile.login)
            return fail(`No user called “${login}” in the demo.`);
        }}
        status={
          state === "loading"
            ? "loading"
            : state === "error"
              ? "error"
              : "ready"
        }
      />
    </WirefrontProvider>
  );
}
