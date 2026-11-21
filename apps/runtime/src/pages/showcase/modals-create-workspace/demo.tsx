// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to a simulated backend, with the dialog open.
// Not shipped by the registry; builders wire CreateWorkspace to their own backend.
import { fail, ok } from "@wirefront/ui/wirefront/types";
import * as fixtures from "./fixtures";
import type { CreateWorkspaceInput } from "./schema";
import { CreateWorkspace } from "./view";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function demoCheckSlug(slug: string) {
  return !fixtures.takenSlugs.includes(slug);
}

async function demoCreate(input: CreateWorkspaceInput) {
  await wait(900);
  if (fixtures.takenSlugs.includes(input.slug)) return fail(undefined, { name: "A workspace already uses that URL. Try another name." });
  return ok({ ...fixtures.createWorkspace, ...input });
}

export function ModalsCreateWorkspaceShowcasePage() {
  return (
    <CreateWorkspace
      checkSlug={demoCheckSlug}
      defaultName={fixtures.defaultName}
      defaultOpen
      onCreate={demoCreate}
      step={{ current: 1, total: 3 }}
      teamDomain={fixtures.teamDomain}
      urlPrefix={fixtures.urlPrefix}
    />
  );
}
