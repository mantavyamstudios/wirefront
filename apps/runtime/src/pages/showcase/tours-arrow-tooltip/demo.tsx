// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: a placeholder issue list with data-tour targets; the current one gets a ring.
// Not shipped by the registry; builders tag their own elements with data-tour.
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import * as fixtures from "./fixtures";
import { TooltipTour } from "./view";

const FILTERS = [
  ["status", "Status"],
  ["assignee", "Assignee"],
  ["priority", "Priority"],
] as const;
const ROWS = ["r1", "r2", "r3", "r4", "r5", "r6"];

export function ToursArrowTooltipShowcasePage() {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  const ring = (name: string) => active === name && "ring-2 ring-primary/70 ring-offset-2 ring-offset-background";
  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <div className="grid min-h-svh grid-cols-1 sm:grid-cols-[60px_1fr]">
        <aside className="border-border/60 border-e bg-foreground/2 max-sm:hidden" />
        <main className="min-w-0 p-4 pb-72 sm:p-6 lg:p-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Issues</div>
              <h1 className="mt-1 font-heading text-2xl">Workload</h1>
            </div>
            <Button className={cn(ring("new"))} data-tour="new" size="sm" type="button">
              <PlusIcon />
              New issue
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2 sm:mt-8">
            {FILTERS.map(([id, label]) => (
              <button className={cn("h-9 rounded-md border border-border/60 bg-background/40 px-3 text-muted-foreground text-sm hover:text-foreground pointer-coarse:h-10", ring(id))} data-tour={id} key={id} type="button">
                {label}
              </button>
            ))}
          </div>
          <div aria-hidden className="mt-6 space-y-2">
            {ROWS.map((k, i) => (
              <div className={cn("h-12 rounded-md border border-border/40 bg-foreground/2", i === 0 && ring("row"))} data-tour={i === 0 ? "row" : undefined} key={k} />
            ))}
          </div>
          {open ? null : (
            <Button className="mt-6" onClick={() => setOpen(true)} type="button" variant="outline">
              Show tips again
            </Button>
          )}
        </main>
      </div>
      <TooltipTour onClose={() => setOpen(false)} onStepChange={setActive} open={open} steps={fixtures.steps} />
    </div>
  );
}
