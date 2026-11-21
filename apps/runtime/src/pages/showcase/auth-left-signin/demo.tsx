// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the screen with Wirefront's demo logo, providers and testimonial.
// Not shipped by the registry; builders pass their own.
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Card } from "@wirefront/ui/card";
import { Separator } from "@wirefront/ui/separator";
import { SplitSignIn } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function AuthLeftSigninShowcasePage() {
  return (
    <SplitSignIn
      aside={
        <>
          <TestimonialCard />
          <LogoStrip />
        </>
      }
      brandName="Wirefront"
      forgotPasswordHref="#forgot-password"
      onProvider={() => wait(600)}
      onSignIn={() => wait(800)}
      providers={[
        { id: "github", name: "GitHub", icon: <GitHubIcon /> },
        { id: "google", name: "Google", icon: <GoogleIcon /> },
      ]}
      signUpHref="#sign-up"
      logo={<BrandMark />}
    />
  );
}

function BrandMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="size-5 text-foreground"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M3 12 L21 12" />
      <path d="M12 3 L12 21" />
    </svg>
  );
}

function TestimonialCard() {
  return (
    <Card className="w-full p-6 xl:p-8">
      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
        Testimonial
      </div>
      <blockquote className="mt-5 font-heading text-2xl leading-snug tracking-tight">
        “Orbit feels like the platform we always wanted to build ourselves —
        fast, opinionated, and out of the way.”
      </blockquote>
      <div className="mt-8 flex items-center gap-3">
        <Avatar>
          <AvatarFallback>PJ</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium text-sm">Priya Joshi</span>
          <span className="text-muted-foreground text-xs">
            Head of Design, Foundry Labs
          </span>
        </div>
      </div>
    </Card>
  );
}

function LogoStrip() {
  const logos = ["ATLAS", "FOUNDRY", "NIMBUS", "QUARTZ"];
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
        Trusted by 2,400 teams
      </div>
      <div className="flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-3 text-muted-foreground">
        {logos.map((logo, i) => (
          <div key={logo} className="flex items-center gap-6">
            {i > 0 ? (
              <Separator orientation="vertical" className="h-4" />
            ) : null}
            <span className="font-heading font-bold text-sm uppercase tracking-[0.25em]">
              {logo}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="currentColor">
      <path d="M12 .5C5.7.5.6 5.6.6 11.9c0 5 3.3 9.3 7.8 10.8.6.1.8-.2.8-.5v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.5-.3-5.2-1.3-5.2-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.2 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5 4.5-1.5 7.8-5.8 7.8-10.8C23.4 5.6 18.3.5 12 .5Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path
        fill="#EA4335"
        d="M12 5c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.5 15 .5 12 .5 7.3.5 3.3 3.2 1.4 7.1l3.8 3c.9-2.8 3.5-4.6 6.8-4.6Z"
      />
      <path
        fill="#34A853"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.7-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.6Z"
      />
      <path
        fill="#FBBC05"
        d="M5.2 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1l-3.8-3C.5 8.7 0 10.3 0 12s.5 3.3 1.4 4.7l3.8-2.6Z"
      />
      <path
        fill="#4285F4"
        d="M12 23.5c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.3 0-6-2-6.9-4.6l-3.8 3C3.3 20.8 7.3 23.5 12 23.5Z"
      />
    </svg>
  );
}
