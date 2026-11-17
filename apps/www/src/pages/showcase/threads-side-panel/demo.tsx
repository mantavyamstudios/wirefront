// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the panel opens on load over a placeholder issue page; actions save after a
// short wait. Not shipped by the registry; builders wire ThreadPanel to their own backend.
import { Button } from "@wirefront/ui/button";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { MessageSquareIcon } from "lucide-react";
import { useState } from "react";
import * as fixtures from "./fixtures";
import { ThreadPanel } from "./view";

const demoNow = () => new Date(fixtures.now);
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const ROWS = ["a", "b", "c", "d"];

export function ThreadsSidePanelShowcasePage() {
  const [open, setOpen] = useState(true);
  const [subscribed, setSubscribed] = useState(fixtures.getConversation.subscribed);
  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <div className="relative min-h-svh bg-background text-foreground">
        <div className="grid min-h-svh grid-cols-1 md:grid-cols-[220px_1fr]">
          <aside aria-hidden className="space-y-2 border-border/60 border-e bg-foreground/[0.02] p-4 max-md:hidden">
            <div className="h-3 w-28 rounded bg-foreground/15" />
            <div className="mt-3 h-2 w-32 rounded bg-foreground/10" />
          </aside>
          <main className="min-w-0 px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Issue · ENG-128</div>
            <h1 className="mt-1 font-heading text-2xl sm:text-3xl">Audit log query rewrite</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground text-sm">The conversation panel slides in from the right — full screen on phones.</p>
            <Button className="mt-4" onClick={() => setOpen(true)} type="button" variant="outline">
              <MessageSquareIcon />
              Open conversation
            </Button>
            <div aria-hidden className="mt-8 space-y-3">
              {ROWS.map((k) => (
                <div className="h-16 rounded-md border border-border/50 bg-foreground/[0.02]" key={k} />
              ))}
            </div>
          </main>
        </div>
        <ThreadPanel
          comments={fixtures.getConversation.comments}
          currentUser={{ name: "You" }}
          onOpenChange={setOpen}
          onReact={() => wait(300)}
          onReply={() => wait(500)}
          onSubscribedChange={setSubscribed}
          open={open}
          subject={fixtures.getConversation.subject}
          subscribed={subscribed}
        />
      </div>
    </WirefrontProvider>
  );
}
