// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: a placeholder app with data-tour targets; the tour starts on load.
// Not shipped by the registry; builders tag their own elements with data-tour.
import { Button } from "@wirefront/ui/button";
import { PlusIcon, SearchIcon, UserPlusIcon } from "lucide-react";
import { useState } from "react";
import * as fixtures from "./fixtures";
import { SpotlightTour } from "./view";

const CARDS = ["a", "b", "c", "d", "e", "f"];

export function ToursSpotlightShowcasePage() {
  const [open, setOpen] = useState(true);
  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <div className="grid min-h-svh grid-cols-1 md:grid-cols-[220px_1fr]">
        <aside aria-hidden className="space-y-2 border-border/60 border-e bg-foreground/2 p-4 max-md:hidden">
          <div className="h-3 w-24 rounded bg-foreground/15" />
          <div className="h-2 w-32 rounded bg-foreground/10" />
          <div className="h-2 w-28 rounded bg-foreground/10" />
        </aside>
        <main className="min-w-0 p-4 pb-64 sm:p-6 lg:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-9 min-w-0 flex-1 basis-full items-center gap-2 rounded-lg border border-border/60 px-3 text-muted-foreground text-sm sm:max-w-xs sm:basis-auto" data-tour="search">
              <SearchIcon aria-hidden className="size-4 shrink-0" />
              <span className="truncate">Search…</span>
            </div>
            <Button data-tour="new" size="sm" type="button">
              <PlusIcon />
              New project
            </Button>
            <Button data-tour="invite" size="sm" type="button" variant="outline">
              <UserPlusIcon />
              Invite
            </Button>
          </div>
          <div aria-hidden className="mt-8 h-3 w-48 max-w-full rounded bg-foreground/20" />
          <div aria-hidden className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3" data-tour="projects">
            {CARDS.map((k) => (
              <div className="h-24 rounded-xl border border-border/50 bg-foreground/2" key={k} />
            ))}
          </div>
          {open ? null : (
            <Button className="mt-6" onClick={() => setOpen(true)} type="button" variant="outline">
              Restart tour
            </Button>
          )}
        </main>
      </div>
      <SpotlightTour onClose={() => setOpen(false)} open={open} steps={fixtures.steps} />
    </div>
  );
}
