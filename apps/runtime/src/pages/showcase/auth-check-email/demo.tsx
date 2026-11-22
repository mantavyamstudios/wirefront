// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the screen with Wirefront's demo illustration, brand and caption.
// Not shipped by the registry; builders pass their own.
import welcomeSrc from "@/assets/figures/welcome.png";
import { ThemeToggle } from "@wirefront/ui/theme-toggle";
import * as fixtures from "./fixtures";
import { CheckEmail } from "./view";

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function AuthCheckEmailShowcasePage() {
  return (
    <CheckEmail
      actions={<ThemeToggle />}
      brand={
        <div className="flex items-center gap-2 font-mono text-sm">
          <span className="inline-block h-2 w-2 rounded-full bg-foreground" />
          <span className="uppercase tracking-[0.2em]">Wirefront</span>
        </div>
      }
      caption={{
        eyebrow: "Sign-in design",
        text: "Split layout with a particle field on the left and a single centered form on the right.",
      }}
      changeEmailHref="#sign-in"
      email={fixtures.email}
      expiresInMinutes={10}
      illustration={welcomeSrc}
      onResend={() => wait(600)}
      supportHref="#support"
    />
  );
}
