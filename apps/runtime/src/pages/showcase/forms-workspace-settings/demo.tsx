// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to a simulated backend.
// Not shipped by the registry; builders wire WorkspaceSettings to their own backend.
import { fail, ok } from "@wirefront/ui/wirefront/types";
import * as fixtures from "./fixtures";
import type { GeneralSettings } from "./schema";
import { WorkspaceSettings } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function demoSave({ slug }: GeneralSettings) {
  await wait(700);
  if (slug === "admin") return fail(undefined, { slug: "That slug is taken." });
}

async function demoUpload(file: File) {
  await wait(700);
  return ok({ avatarUrl: URL.createObjectURL(file) });
}

export function FormsWorkspaceSettingsShowcasePage() {
  return (
    <WorkspaceSettings
      activeSection="general"
      defaultValues={fixtures.getGeneralSettings}
      nav={fixtures.nav}
      onSave={demoSave}
      onUploadAvatar={demoUpload}
      timeZones={fixtures.timeZones}
      urlPrefix={fixtures.urlPrefix}
    />
  );
}
