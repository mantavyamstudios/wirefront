// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire DeployHistory to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { DeployHistory } from "./view";

const demoNow = () => new Date(fixtures.now);
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function TimelinesDeploysShowcasePage() {
  const state = useShowcaseState();
  return (
    <WirefrontProvider locale="en-US" now={demoNow}>
      <DeployHistory
        deploys={state === "loading" || state === "error" ? undefined : state === "empty" ? [] : fixtures.listDeploys}
        error="Deploys didn’t load. Check your connection and try again."
        onRefresh={() => wait(700)}
        onRetry={() => {}}
        onRollBack={() => wait(900)}
        project={fixtures.project}
        status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
      />
    </WirefrontProvider>
  );
}
