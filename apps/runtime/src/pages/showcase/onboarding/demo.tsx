// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the flow with Wirefront's demo illustration, brand and caption.
// Not shipped by the registry; builders pass their own.
import clustersSrc from "@/assets/figures/clusters.png";
import { ThemeToggle } from "@wirefront/ui/theme-toggle";
import * as fixtures from "./fixtures";
import { WorkspaceOnboarding } from "./view";

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function OnboardingShowcasePage() {
  return (
    <WorkspaceOnboarding
      actions={<ThemeToggle />}
      brand={
        <div className="flex items-center gap-2 font-mono text-sm">
          <span className="inline-block h-2 w-2 rounded-full bg-foreground" />
          <span className="uppercase tracking-[0.2em]">Wirefront</span>
        </div>
      }
      caption={{
        eyebrow: "First steps",
        text: "A guided multi-step setup, paced so each screen carries one decision at a time.",
      }}
      enterHref="#workspace"
      illustration={clustersSrc}
      onCreateWorkspace={() => wait(400)}
      onInvite={() => wait(600)}
      plan={fixtures.plan}
    />
  );
}
