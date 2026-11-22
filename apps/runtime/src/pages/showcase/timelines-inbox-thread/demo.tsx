// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire EmailThread to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { EmailThread } from "./view";

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function TimelinesInboxThreadShowcasePage() {
  const state = useShowcaseState();
  return (
    <WirefrontProvider locale="en-US" timeZone="UTC">
      <EmailThread
        error="The thread didn’t load. Check your connection and try again."
        onReply={() => wait(600)}
        onRetry={() => {}}
        onSaveDraft={() => wait(300)}
        onToggleStar={() => wait(300)}
        status={
          state === "loading"
            ? "loading"
            : state === "error"
              ? "error"
              : "ready"
        }
        thread={
          state === "loading" || state === "error"
            ? undefined
            : fixtures.getThread
        }
      />
    </WirefrontProvider>
  );
}
