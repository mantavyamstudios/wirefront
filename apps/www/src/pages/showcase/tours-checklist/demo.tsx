// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the checklist docked over a placeholder welcome page.
// Not shipped by the registry; builders load listSetupTasks and save onToggle.
import { KeyIcon, LayersIcon, PaletteIcon, UsersIcon, ZapIcon } from "lucide-react";
import { useState } from "react";
import * as fixtures from "./fixtures";
import { SetupChecklist } from "./view";

const icons = { "create-project": <LayersIcon />, invite: <UsersIcon />, theme: <PaletteIcon />, "api-key": <KeyIcon />, "first-deploy": <ZapIcon /> };
const CARDS = ["a", "b", "c", "d"];

export function ToursChecklistShowcasePage() {
  const [hidden, setHidden] = useState(false);
  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <div className="grid min-h-svh grid-cols-1 md:grid-cols-[220px_1fr]">
        <aside aria-hidden className="space-y-2 border-border/60 border-e bg-foreground/[0.02] p-4 max-md:hidden">
          <div className="h-3 w-28 rounded bg-foreground/15" />
          <div className="mt-3 h-2 w-32 rounded bg-foreground/10" />
        </aside>
        <main className="min-w-0 p-4 pb-32 sm:p-6 lg:p-10">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Welcome</div>
          <h1 className="mt-1 font-heading text-2xl sm:text-3xl">First steps</h1>
          <p className="mt-2 max-w-md text-muted-foreground text-sm">Your onboarding checklist stays docked at the bottom of the screen. Tick it off as you explore.</p>
          <div aria-hidden className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CARDS.map((k) => (
              <div className="h-32 rounded-xl border border-border/50 bg-foreground/[0.02]" key={k} />
            ))}
          </div>
        </main>
      </div>
      {hidden ? null : <SetupChecklist icons={icons} onHide={() => setHidden(true)} tasks={fixtures.listSetupTasks} />}
    </div>
  );
}
