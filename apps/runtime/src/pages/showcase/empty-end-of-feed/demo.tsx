// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the empty state in sample page chrome. Not shipped by the registry.
import { useFormat, WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import * as fixtures from "./fixtures";
import { EndOfFeed } from "./view";

const demoNow = () => new Date(fixtures.now);
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Feed() {
  const format = useFormat();
  return (
    <ol className="flex flex-col gap-3">
      {fixtures.feed.map((event) => (
        <li className="rounded-lg border border-border/70 bg-background px-4 py-3 text-sm" key={event.id}>
          <span className="font-medium">{event.who}</span> <span className="text-muted-foreground">{event.what}</span>
          <span className="ms-2 font-mono text-[11px] text-muted-foreground">{format.relative(event.at)}</span>
        </li>
      ))}
    </ol>
  );
}

export function EmptyEndOfFeedShowcasePage() {
  return (
    <WirefrontProvider now={demoNow}>
      <div className="min-h-svh bg-background">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <h1 className="font-heading text-xl">Activity</h1>
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Today · 3 events</span>
          </div>
          <Feed />
          <EndOfFeed onRefresh={() => wait(800)} />
        </div>
      </div>
    </WirefrontProvider>
  );
}
