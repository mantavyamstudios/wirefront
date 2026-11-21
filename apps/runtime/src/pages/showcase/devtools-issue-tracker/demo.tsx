// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: the tracker in devl.dev's frame with a fixed clock; changes save after a short
// wait and new issues get the next free number. Not shipped by the registry.
import { ok } from "@wirefront/ui/wirefront/types";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useRef } from "react";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import { IssueTracker } from "./view";

const demoNow = () => new Date(fixtures.now);
const save = () => new Promise<void>((resolve) => setTimeout(resolve, 200));

export function DevtoolsIssueTrackerShowcasePage() {
  const next = useRef(Math.max(...fixtures.listIssues.map((i) => Number(i.id.split("-")[1]) || 0)) + 1);
  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <DevlFrame>
        <IssueTracker
          cycle={fixtures.cycle}
          issues={fixtures.listIssues}
          labels={fixtures.labels}
          me={fixtures.me}
          onComment={save}
          onCreate={async ({ status }) => {
            await save();
            return ok({ ...fixtures.createIssue, id: `${fixtures.team.key}-${next.current++}`, status });
          }}
          onDelete={save}
          onUpdate={save}
          people={fixtures.people}
          team={fixtures.team}
        />
      </DevlFrame>
    </WirefrontProvider>
  );
}
