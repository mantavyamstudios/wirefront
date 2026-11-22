// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the tour opens on load above a placeholder app; the button reopens it.
// Not shipped by the registry; builders open WelcomeTour on first sign-in and save onComplete.
import { Button } from "@wirefront/ui/button";
import {
  KeyboardIcon,
  LayersIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import { useState } from "react";
import * as fixtures from "./fixtures";
import { WelcomeTour } from "./view";

const icons = {
  welcome: <SparklesIcon />,
  projects: <LayersIcon />,
  people: <UsersIcon />,
  keyboard: <KeyboardIcon />,
};

export function ToursWelcomeCarouselShowcasePage() {
  const [open, setOpen] = useState(true);
  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <div
        aria-hidden
        className="absolute inset-0 grid grid-cols-1 opacity-30 md:grid-cols-[200px_1fr]"
      >
        <div className="space-y-2 border-border/40 border-e bg-foreground/2 p-4 max-md:hidden">
          <div className="h-3 w-24 rounded bg-foreground/10" />
          <div className="h-2 w-32 rounded bg-foreground/10" />
        </div>
        <div className="space-y-3 p-4 sm:p-10">
          <div className="h-4 w-48 max-w-full rounded bg-foreground/15" />
          <div className="h-32 rounded-xl border border-border/40 bg-foreground/2" />
          <div className="h-32 rounded-xl border border-border/40 bg-foreground/2" />
        </div>
      </div>
      <div className="relative z-10 grid min-h-svh place-items-center p-4">
        <Button onClick={() => setOpen(true)} type="button" variant="outline">
          Show welcome tour
        </Button>
      </div>
      <WelcomeTour
        icons={icons}
        onOpenChange={setOpen}
        open={open}
        steps={fixtures.steps}
      />
    </div>
  );
}
