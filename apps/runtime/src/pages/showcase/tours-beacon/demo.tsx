// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: two beacons inside a placeholder inbox; the first opens on load.
// Not shipped by the registry; builders place FeatureBeacon inside the element it explains.
import { Button } from "@wirefront/ui/button";
import { LayersIcon, SlidersHorizontalIcon } from "lucide-react";
import { useState } from "react";
import * as fixtures from "./fixtures";
import { FeatureBeacon } from "./view";

const CARDS = ["a", "b", "c", "d"];

export function ToursBeaconShowcasePage() {
  const [seen, setSeen] = useState<string[]>([]);
  const dismiss = (id: string) => setSeen((s) => [...s, id]);
  const [stack, filters] = fixtures.listUnseenHints;
  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <div className="grid min-h-svh grid-cols-1 md:grid-cols-[220px_1fr]">
        <aside aria-hidden className="space-y-2 border-border/60 border-e bg-foreground/2 p-4 max-md:hidden">
          <div className="h-3 w-28 rounded bg-foreground/15" />
          <div className="h-2 w-32 rounded bg-foreground/10" />
        </aside>
        <main className="min-w-0 p-4 sm:p-6 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Inbox</div>
              <h1 className="mt-1 font-heading text-2xl sm:text-3xl">Today</h1>
            </div>
            <div className="relative">
              <Button size="sm" type="button" variant="outline">
                <LayersIcon />
                Stack view
              </Button>
              {stack && !seen.includes(stack.id) ? <FeatureBeacon defaultOpen hint={stack} onDismiss={dismiss} /> : null}
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CARDS.map((k, i) => (
              <div className="relative h-32 rounded-xl border border-border/50 bg-foreground/2 p-4" key={k}>
                <div aria-hidden className="h-2 w-24 rounded bg-foreground/15" />
                <div aria-hidden className="mt-2 h-2 w-32 max-w-full rounded bg-foreground/10" />
                {i === 2 && filters ? (
                  <div className="absolute inset-e-3 bottom-3">
                    <span className="relative inline-flex">
                      <SlidersHorizontalIcon aria-hidden className="size-4 text-muted-foreground" />
                      {!seen.includes(filters.id) ? <FeatureBeacon hint={filters} onDismiss={dismiss} /> : null}
                    </span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
