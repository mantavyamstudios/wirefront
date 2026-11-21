// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire DeveloperLabs to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { DeveloperLabs } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function SettingsDeveloperShowcasePage() {
  const state = useShowcaseState();
  return (
    <WirefrontProvider timeZone="UTC">
      <DeveloperLabs
        apiExplorerHref="#api-explorer"
        data={state === "loading" || state === "error" ? undefined : state === "empty" ? { ...fixtures.getDeveloperSettings, groups: [] } : fixtures.getDeveloperSettings}
        error="Developer settings didn’t load. Check your connection and try again."
        logLines={fixtures.logLines}
        onRetry={() => {}}
        onSetDebug={() => wait(300)}
        onSetEnvironment={() => wait(300)}
        onSetFlag={() => wait(300)}
        status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
      />
    </WirefrontProvider>
  );
}
