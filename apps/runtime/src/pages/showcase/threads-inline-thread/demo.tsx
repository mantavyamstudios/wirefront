// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: a placeholder planning doc with one anchored thread. Replies save after a
// short wait. Not shipped by the registry; builders pass their own document and thread.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import * as fixtures from "./fixtures";
import { InlineThread } from "./view";

const demoNow = () => new Date(fixtures.now);
const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function ThreadsInlineThreadShowcasePage() {
  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <InlineThread
        after={
          <>
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
              That’s the bet, anyway. The alternative — a single sprawling
              domain — looked appealing in the early days, but every refactor
              since has paid for itself in confidence.
            </p>
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
              Next quarter we’re adding two more contexts: webhooks and the jobs
              runtime. Both are heavily tested in isolation already.
            </p>
          </>
        }
        anchor="We’ve been able to move quickly because the kernel is small and the scope of each change is narrow. When something fails, the blast radius is one bounded context — the auth, billing, or audit module."
        before={
          <>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
              Doc · Engineering · Q3 planning
            </div>
            <h1 className="mt-1 font-heading text-2xl tracking-tight sm:text-3xl">
              How we ship.
            </h1>
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
              Three things have shaped how Orbit ships in the last quarter:
              tighter audit log retention, scoped invites, and the new pricing
              page. Each landed in under two weeks.
            </p>
          </>
        }
        comments={fixtures.listThreadComments}
        currentUser={{ name: "You" }}
        onReply={() => wait(500)}
        onResolve={() => {}}
      />
    </WirefrontProvider>
  );
}
