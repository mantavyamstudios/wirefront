// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire SsoSetup to their own backend.
import { ok } from "@wirefront/ui/wirefront/types";
import { useState } from "react";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { SsoSetup } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function SettingsSsoShowcasePage() {
  const state = useShowcaseState();
  const [enforced, setEnforced] = useState(false);
  return (
    <SsoSetup
      config={state === "loading" || state === "error" ? undefined : { ...fixtures.getSsoConfig, enforced }}
      error="SSO settings didn’t load. Check your connection and try again."
      onEnforce={async () => {
        await wait(600);
        setEnforced(true);
      }}
      onRetry={() => {}}
      onSaveMappings={() => wait(400)}
      onSelectProvider={() => {}}
      onTest={async () => {
        await wait(900);
        return ok(fixtures.testSso);
      }}
      product="Acme"
      providers={fixtures.listSsoProviders}
      status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
    />
  );
}
