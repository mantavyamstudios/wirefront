// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { CheckIcon, ShieldCheckIcon } from "lucide-react";
import { Button } from "@wirefront/ui/button";
import { Input } from "@wirefront/ui/input";
import { Label } from "@wirefront/ui/label";
import { Textarea } from "@wirefront/ui/textarea";

const FEATURES = [
  "Unlimited everything",
  "SAML SSO + SCIM",
  "Custom roles & permissions",
  "Audit log forever",
  "Dedicated success manager",
  "DPA + procurement support",
  "99.99% uptime SLA",
];

export function PricingContactSales() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* Phones: short pitch → form → proof points, so the form is reachable
          without scrolling past the whole value prop. lg: pitch + proof on the
          left, form on the right spanning both rows. */}
      <div className="mx-auto grid min-h-svh max-w-6xl grid-cols-1 lg:grid-cols-[1.1fr_1fr] lg:grid-rows-[1fr_auto]">
        <section className="flex flex-col justify-end border-border/60 px-4 pt-10 pb-6 sm:px-8 lg:border-r lg:pt-16 lg:pb-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/40 px-2.5 py-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
            <ShieldCheckIcon className="size-3" />
            Enterprise
          </div>
          <h1 className="mt-4 text-balance font-heading text-3xl tracking-tight sm:text-4xl md:text-5xl">
            Built for the procurement people.
          </h1>
          <p className="mt-3 max-w-md text-muted-foreground text-sm leading-relaxed">
            For organisations with compliance, identity, and procurement
            requirements. We'll work through your security questionnaire and DPA
            on the same call.
          </p>
        </section>

        <section className="flex flex-col justify-center px-4 pb-10 sm:px-8 lg:row-span-2 lg:py-16">
          <FormCard />
        </section>

        <section className="flex flex-col justify-start border-border/60 px-4 pb-12 sm:px-8 lg:border-r lg:pb-16">
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:mt-8">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <CheckIcon
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-foreground"
                />
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-border/60 border-t pt-6">
            <Logo>Linear</Logo>
            <Logo>Vercel</Logo>
            <Logo>Stripe</Logo>
            <Logo>Notion</Logo>
          </div>
        </section>
      </div>
    </div>
  );
}

function FormCard() {
  return (
    <form className="rounded-2xl border border-border/60 bg-background/40 p-5 sm:p-6">
      <h2 className="font-heading text-xl">Talk to us.</h2>
      <p className="mt-1 text-muted-foreground text-sm">
        Reply within one business day.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ent-name">Name</Label>
          <Input
            id="ent-name"
            placeholder="Mantavyam"
            autoComplete="name"
            />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ent-co">Company</Label>
          <Input
            id="ent-co"
            placeholder="Acme inc."
            autoComplete="organization"
            />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ent-email">Work email</Label>
          <Input
            id="ent-email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ent-seats">Estimated seats</Label>
          <div className="relative">
            <select
              id="ent-seats"
              className="h-9 w-full appearance-none rounded-lg border border-input bg-background pr-9 pl-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm pointer-coarse:h-10"
            >
              <option>50–100</option>
              <option>100–500</option>
              <option>500–1000</option>
              <option>1000+</option>
            </select>
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
              className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 opacity-60"
            >
              <polyline points="4 6 8 10 12 6" />
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <Label htmlFor="ent-msg">What are you looking for?</Label>
        <Textarea
          id="ent-msg"
          rows={4}
          placeholder="Compliance constraints, timeline, or anything else."
        />
      </div>

      <Button size="lg" type="submit" className="mt-5 w-full">
        Request a call
      </Button>
      <p className="mt-2 text-center text-muted-foreground text-xs">
        We don't share your details with anyone.
      </p>
    </form>
  );
}

function Logo({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-medium text-muted-foreground text-sm tracking-wide">
      {children}
    </span>
  );
}
