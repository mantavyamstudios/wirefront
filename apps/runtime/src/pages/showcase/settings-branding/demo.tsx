// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire WorkspaceBranding to their own backend.
import { ok } from "@wirefront/ui/wirefront/types";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { WorkspaceBranding } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function SettingsBrandingShowcasePage() {
  const state = useShowcaseState();
  return (
    <WorkspaceBranding
      data={state === "loading" || state === "error" ? undefined : fixtures.getBranding}
      defaultColors={fixtures.defaultColors}
      error="Branding didn’t load. Check your connection and try again."
      onRetry={() => {}}
      onSaveColors={() => wait(400)}
      onSaveDomain={() => wait(400)}
      onSaveEmail={() => wait(400)}
      onUploadLogo={async ({ file }) => {
        await wait(600);
        return ok({ url: URL.createObjectURL(file), fileName: file.name, bytes: file.size });
      }}
      onVerifyDomain={async () => {
        await wait(800);
        return ok(fixtures.verifyDomain);
      }}
      presets={fixtures.presets}
      status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
    />
  );
}
