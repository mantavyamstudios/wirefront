// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire SecurityOverview to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { ok } from "@wirefront/ui/wirefront/types";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { SecurityOverview } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const demoNow = () => new Date(fixtures.now);

export function SettingsSecurityShowcasePage() {
  const state = useShowcaseState();
  return (
    <WirefrontProvider now={demoNow}>
      <SecurityOverview
        data={state === "loading" || state === "error" ? undefined : state === "empty" ? { ...fixtures.getSecurity, passkeys: [], sessions: fixtures.getSecurity.sessions.slice(0, 1) } : fixtures.getSecurity}
        error="Security settings didn’t load. Check your connection and try again."
        onAddPasskey={() => wait(800)}
        onRegenerateCodes={async () => {
          await wait(600);
          return ok(fixtures.regenerateRecoveryCodes);
        }}
        onRemovePasskey={() => wait(500)}
        onRetry={() => {}}
        onRevealCodes={async () => {
          await wait(400);
          return ok(fixtures.getRecoveryCodes);
        }}
        onRevokeOtherSessions={() => wait(600)}
        onRevokeSession={() => wait(500)}
        status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
        twoFactorHref="#two-factor"
      />
    </WirefrontProvider>
  );
}
