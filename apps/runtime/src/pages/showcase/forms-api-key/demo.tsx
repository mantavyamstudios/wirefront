// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to a simulated backend.
// Not shipped by the registry; builders wire CreateApiKey to their own backend.
import { ok } from "@wirefront/ui/wirefront/types";
import * as fixtures from "./fixtures";
import { CreateApiKey } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function demoCreate() {
  await wait(700);
  return ok(fixtures.createApiKey);
}

export function FormsApiKeyShowcasePage() {
  return <CreateApiKey defaultScopes={fixtures.defaultScopes} onCancel={() => {}} onCreate={demoCreate} scopeGroups={fixtures.scopeGroups} />;
}
