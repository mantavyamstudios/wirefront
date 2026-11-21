// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: a sample comment with two mentions, and Maya's card shown open beside it.
// Not shipped by the registry; builders render PersonHoverCard wherever they render mentions.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import * as fixtures from "./fixtures";
import { PersonHoverCard } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const follow = () => wait(400);

export function ProfileHoverCardShowcasePage() {
  return (
    <WirefrontProvider locale="en-US" timeZone="UTC">
      <div className="grid min-h-svh place-items-center bg-background px-4 py-8 sm:px-8 sm:py-10">
        <div className="grid w-full max-w-5xl grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <article className="rounded-xl border border-border/60 bg-background/40 p-4 leading-relaxed sm:p-6">
            <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
              <span>#design-crit</span>
              <span>·</span>
              <span>2h ago</span>
            </div>
            <p className="mt-3 text-foreground/85 text-sm">
              I think we can ship the audit log retention work before the offsite. <PersonHoverCard onToggleFollow={follow} person={fixtures.getPersonSummary} /> already has the migration in flight, and the UI just needs the new field on the workspace settings
              panel. Pinging <PersonHoverCard onToggleFollow={follow} person={fixtures.james} /> in case you want to review the tracking events before merge.
            </p>
            <p className="mt-3 text-foreground/85 text-sm">We could also pair on this — happy to grab 30 minutes tomorrow morning if it helps.</p>
          </article>
          <div className="lg:pt-12">
            <PersonHoverCard className="rounded-xl border border-border shadow-2xl" inline onToggleFollow={follow} person={fixtures.getPersonSummary} />
            <div className="ms-8 mt-2 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
              <span className="block h-px w-8 bg-border" />
              <span className="pointer-coarse:hidden">hover a mention · 200ms delay</span>
              <span className="hidden pointer-coarse:inline">tap a mention to open</span>
            </div>
          </div>
        </div>
      </div>
    </WirefrontProvider>
  );
}
