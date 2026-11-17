// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the tip above a placeholder project list; "Show tip" brings it back.
// Not shipped by the registry; builders show TipCard with their next tip.
import { Button } from "@wirefront/ui/button";
import { useState } from "react";
import * as fixtures from "./fixtures";
import { TipCard } from "./view";

const CARDS = ["a", "b", "c", "d", "e", "f"];

export function ToursInlineHintShowcasePage() {
  const [open, setOpen] = useState(true);
  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <div className="grid min-h-svh grid-cols-1 md:grid-cols-[220px_1fr]">
        <aside aria-hidden className="space-y-2 border-border/60 border-e bg-foreground/[0.02] p-4 max-md:hidden">
          <div className="h-3 w-28 rounded bg-foreground/15" />
          <div className="mt-3 h-2 w-32 rounded bg-foreground/10" />
        </aside>
        <main className="min-w-0 p-4 pb-64 sm:p-6 sm:pb-64 lg:p-10">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Projects</div>
          <h1 className="mt-1 font-heading text-2xl sm:text-3xl">All projects</h1>
          {open ? null : (
            <Button className="mt-4" onClick={() => setOpen(true)} size="sm" type="button" variant="outline">
              Show tip
            </Button>
          )}
          <div aria-hidden className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.map((k) => (
              <div className="h-28 rounded-xl border border-border/50 bg-foreground/[0.02] p-3" key={k} />
            ))}
          </div>
        </main>
      </div>
      <TipCard allHref="#tips" onDismiss={() => setOpen(false)} onSnooze={() => setOpen(false)} onTry={() => setOpen(false)} tip={open ? fixtures.getNextTip : undefined} />
    </div>
  );
}
