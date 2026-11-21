// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the screen with Wirefront's demo logo, providers and product preview.
// Not shipped by the registry; builders pass their own.
import { CheckIcon } from "lucide-react";
import { HeroSignIn } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function AuthRightSigninShowcasePage() {
  return (
    <HeroSignIn
      forgotPasswordHref="#forgot-password"
      onProvider={() => wait(600)}
      onSignIn={() => wait(800)}
      providers={[
        { id: "github", name: "GitHub", icon: <GitHubIcon /> },
        { id: "google", name: "Google", icon: <GoogleIcon /> },
      ]}
      signUpHref="#sign-up"
      hero={<Hero />}
      logo={<BrandMark />}
    />
  );
}

function Hero() {
  return (
    <div className="relative z-10 max-w-md px-12">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          Open source · MIT
        </div>
        <h2 className="mt-3 font-heading text-4xl tracking-tight">
          Build orbit-class products.
        </h2>
        <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
          A practical scratchpad of UI patterns built on shadcn/ui — fast,
          opinionated, accessible.
        </p>

        <ul className="mt-8 flex flex-col gap-4">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border border-border bg-foreground/[0.04]">
                <CheckIcon className="size-3 text-foreground/70" />
              </span>
              <div>
                <div className="font-medium text-sm">{f.title}</div>
                <div className="text-muted-foreground text-xs leading-relaxed">
                  {f.blurb}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <DashboardMock />
      </div>
  );
}

const FEATURES = [
  {
    title: "55 primitives",
    blurb: "Built on Base UI for accessibility-first composition.",
  },
  {
    title: "Tailwind v4",
    blurb: "First-class CSS-vars and dark mode out of the box.",
  },
  {
    title: "Particle field shader",
    blurb: "Real WebGL background with a palette shuffle.",
  },
  {
    title: "10 production-ready cards",
    blurb: "Stat tiles, pricing, kanban, calendar, and more.",
  },
];

function DashboardMock() {
  const tiles = [
    { label: "MRR", value: "$48.2k", delta: "+12.4%" },
    { label: "Active", value: "12,840", delta: "+4.1%" },
    { label: "Churn", value: "1.8%", delta: "−0.6%" },
  ];
  return (
    <div className="mt-8 rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="grid grid-cols-3 gap-2">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-lg border border-border/70 bg-foreground/[0.02] px-2 py-2"
          >
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
              {t.label}
            </div>
            <div className="mt-1 font-heading font-semibold text-sm tabular-nums">
              {t.value}
            </div>
            <div className="font-mono text-[10px] text-category-2-foreground">
              {t.delta}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 rounded-lg border border-border/70 bg-foreground/[0.02] p-2">
        <svg
          viewBox="0 0 200 60"
          aria-hidden
          className="block h-14 w-full"
          preserveAspectRatio="none"
        >
          <polyline
            points="0,48 30,42 60,38 90,30 120,26 150,18 180,12 200,6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-foreground/70"
          />
          <polyline
            points="0,52 30,50 60,48 90,46 120,42 150,40 180,38 200,34"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-foreground/30"
            strokeDasharray="3 3"
          />
        </svg>
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center justify-center">
      <span className="inline-flex size-9 items-center justify-center rounded-lg bg-foreground text-background">
        <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="none">
          <circle cx="12" cy="12" r="4" fill="currentColor" />
          <ellipse
            cx="12"
            cy="12"
            rx="9"
            ry="3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            transform="rotate(-25 12 12)"
          />
        </svg>
      </span>
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
