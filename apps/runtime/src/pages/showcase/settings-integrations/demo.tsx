// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire IntegrationDirectory to their own backend.
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { IntegrationDirectory } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function SettingsIntegrationsShowcasePage() {
  const state = useShowcaseState();
  return (
    <IntegrationDirectory
      error="The integrations service didn’t respond. Check your connection and try again."
      integrations={state === "loading" || state === "error" ? undefined : state === "empty" ? [] : fixtures.listIntegrations}
      onConnect={() => wait(800)}
      onRetry={() => {}}
      status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
    />
  );
}
