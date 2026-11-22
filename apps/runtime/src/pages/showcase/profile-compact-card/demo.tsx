// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire MemberRoster to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { MemberRoster } from "./view";

const demoNow = () => new Date(fixtures.now);
const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function ProfileCompactCardShowcasePage() {
  const state = useShowcaseState();
  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <MemberRoster
        error="Members didn’t load. Check your connection and try again."
        onChangePermission={() => wait(400)}
        onRemove={() => wait(400)}
        onRetry={() => {}}
        roster={
          state === "loading" || state === "error"
            ? undefined
            : state === "empty"
              ? { members: [], total: 0 }
              : fixtures.listRoster
        }
        status={
          state === "loading"
            ? "loading"
            : state === "error"
              ? "error"
              : "ready"
        }
      />
    </WirefrontProvider>
  );
}
