// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire CredentialsSessions to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { CredentialsSessions } from "./view";

const demoNow = () => new Date(fixtures.now);
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function ProfileCredentialsShowcasePage() {
  const state = useShowcaseState();
  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <CredentialsSessions
        data={state === "loading" || state === "error" ? undefined : fixtures.getCredentials}
        error="Your credentials didn’t load. Check your connection and try again."
        onAddPasskey={() => {}}
        onRemoveKey={() => wait(400)}
        onRetry={() => {}}
        onReview={() => {}}
        onSignOut={() => wait(400)}
        onSignOutAll={() => wait(600)}
        status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
      />
    </WirefrontProvider>
  );
}
