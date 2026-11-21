// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: the review in devl.dev's frame with a fixed clock; every action saves after a
// short wait. Not shipped by the registry; builders wire CodeReview to their own git host.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import { CodeReview } from "./view";

const demoNow = () => new Date(fixtures.now);
const save = () => new Promise<void>((resolve) => setTimeout(resolve, 250));

export function DevtoolsCodeReviewShowcasePage() {
  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <DevlFrame>
        <CodeReview files={fixtures.listPullFiles} me={fixtures.me} onComment={save} onReply={save} onResolve={save} onSubmitReview={save} onViewedChange={() => {}} people={fixtures.people} pr={fixtures.getPullRequest} threads={fixtures.listReviewThreads} viewed={fixtures.viewed} />
      </DevlFrame>
    </WirefrontProvider>
  );
}
