// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: wires the view to a simulated backend inside devl.dev's frame.
// Not shipped by the registry; builders wire FirstRun to their own backend.
import { fail, ok } from "@wirefront/ui/wirefront/types";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import type { AgentInput, WorkspaceStepInput } from "./schema";
import { FirstRun } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function demoCheckSlug(slug: string) {
  return !fixtures.takenSlugs.includes(slug);
}

async function demoSaveWorkspace({ slug }: WorkspaceStepInput) {
  await wait(600);
  if (fixtures.takenSlugs.includes(slug)) return fail(undefined, { slug: "That URL was just taken. Try another." });
}

async function demoConnectTool() {
  await wait(1000);
}

async function demoQuick() {
  await wait(500);
}

async function demoCreateAgent({ name }: AgentInput) {
  await wait(800);
  return ok({ ...fixtures.createAgent, name });
}

export function AuthFirstRunShowcasePage() {
  return (
    <DevlFrame>
      <FirstRun
        checkSlug={demoCheckSlug}
        defaultUseCases={["Support"]}
        defaultWorkspaceName={fixtures.defaultWorkspaceName}
        domain={fixtures.domain}
        inviteSuggestions={fixtures.inviteSuggestions}
        onBookWalkthrough={demoQuick}
        onCancelInvite={demoQuick}
        onConnectTool={demoConnectTool}
        onCreateAgent={demoCreateAgent}
        onDisconnectTool={demoQuick}
        onInvite={demoQuick}
        onSaveWorkspace={demoSaveWorkspace}
        product={fixtures.product}
        templates={fixtures.templates}
        tools={fixtures.tools}
        useCases={fixtures.useCases}
        walkthroughSlots={fixtures.walkthroughSlots}
        workspaceHref={fixtures.workspaceHref}
      />
    </DevlFrame>
  );
}
