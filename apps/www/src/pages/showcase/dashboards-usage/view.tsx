// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button, buttonVariants } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { interpolate, useFormat, useMessages, useWirefront, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { ArrowUpRightIcon, ZapIcon } from "lucide-react";
import type { ReactNode } from "react";

import type { Usage, UsageLimit } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("usage.<key>"). */
export const USAGE_MESSAGES = {
  eyebrow: "Billing · Usage",
  title: "This month",
  viewInvoice: "View invoice",
  plan: "Plan",
  month: "Monthly",
  year: "Annual",
  perMonth: "per month",
  renews: "Renews {date}",
  card: "Card on file: {brand} ending {last4}",
  noCard: "No card on file",
  manage: "Manage",
  upgrade: "Upgrade to {plan}",
  cycle: "Cycle",
  ofDays: "/ {days} days",
  cycleElapsed: "Billing cycle elapsed",
  cycleStart: "Cycle start",
  renewsLabel: "Renews",
  limits: "Limits",
  resets: "Resets {date}",
  usageOf: "{label} usage",
  used: "{percent} used",
  gigabytes: "GB",
  perMonthShort: "/ month",
  errorTitle: "Couldn’t load usage",
  retry: "Try again",
};

export interface UsageDashboardProps {
  /** Leave out while loading. */
  usage?: Usage;
  /** "loading" shows skeletons; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Share of a limit (0–1) from which its meter turns amber. Defaults to 0.8. */
  warnAt?: number;
  /** Where "View invoice" goes. Hidden when not given. */
  invoiceHref?: string;
  /** Where "Manage" (card and plan) goes. Hidden when not given. */
  manageHref?: string;
  /** The next plan up and where upgrading happens. Hidden when not given. */
  upgrade?: { plan: string; href: string };
  className?: string;
}

const DAY = 86_400_000;
const eyebrow = "font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]";
const card = "rounded-xl border border-border/60 bg-background/40 p-6";
const SKELETON_ROWS = ["l1", "l2", "l3", "l4"];

function UsageDashboardScreen({ usage, status = "ready", error, onRetry, warnAt = 0.8, invoiceHref, manageHref, upgrade, className }: UsageDashboardProps) {
  const t = useMessages("usage", USAGE_MESSAGES);
  const format = useFormat();
  const { now } = useWirefront();
  const day = (iso: string) => format.date(iso, { month: "short", day: "numeric", timeZone: "UTC" });

  let content: ReactNode;
  if (status === "error") {
    content = (
      <div className={cn(card, "text-center")}>
        <p className="font-medium">{t.errorTitle}</p>
        {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
        {onRetry ? (
          <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
            {t.retry}
          </Button>
        ) : null}
      </div>
    );
  } else if (status === "loading" || !usage) {
    content = (
      <div aria-busy="true" className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
          <Skeleton className="h-52 rounded-xl motion-reduce:animate-none" />
          <Skeleton className="h-52 rounded-xl motion-reduce:animate-none" />
        </div>
        <div className={cn(card, "flex flex-col gap-5")}>
          {SKELETON_ROWS.map((key) => (
            <Skeleton className="h-8 w-full motion-reduce:animate-none" key={key} />
          ))}
        </div>
      </div>
    );
  } else {
    const start = Date.parse(usage.cycle.start);
    const end = Date.parse(usage.cycle.end);
    const totalDays = Math.max(1, Math.round((end - start) / DAY));
    const elapsed = Math.min(totalDays, Math.max(0, Math.floor((now().getTime() - start) / DAY)));
    content = (
      <>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
          <div className={card}>
            <div className="flex items-center justify-between">
              <div>
                <div className={eyebrow}>{t.plan}</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-heading text-xl">{usage.plan.name}</span>
                  <span className="rounded bg-foreground/[0.08] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em]">{t[usage.plan.interval]}</span>
                </div>
              </div>
              <div className="text-end">
                <div className="font-heading text-2xl">
                  {format.money(usage.monthlyPrice.amount, usage.monthlyPrice.currency, { maximumFractionDigits: 0 })}
                </div>
                <div className={eyebrow}>{t.perMonth}</div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/40 p-3">
              <div className="min-w-0">
                <div className="font-medium text-sm">{interpolate(t.renews, { date: day(usage.cycle.end) })}</div>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  {usage.card ? interpolate(t.card, { brand: usage.card.brand, last4: usage.card.last4 }) : t.noCard}
                </p>
              </div>
              {manageHref ? (
                <WirefrontLink className={buttonVariants({ variant: "ghost", size: "sm" })} href={manageHref}>
                  {t.manage}
                </WirefrontLink>
              ) : null}
            </div>

            {upgrade ? (
              <WirefrontLink className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 w-full")} href={upgrade.href}>
                <ZapIcon />
                {interpolate(t.upgrade, { plan: upgrade.plan })}
                <ArrowUpRightIcon />
              </WirefrontLink>
            ) : null}
          </div>

          <div className={card}>
            <div className={eyebrow}>{t.cycle}</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-heading text-3xl">{elapsed}</span>
              <span className="text-muted-foreground text-xs">{interpolate(t.ofDays, { days: totalDays })}</span>
            </div>
            <div
              aria-label={t.cycleElapsed}
              aria-valuemax={totalDays}
              aria-valuemin={0}
              aria-valuenow={elapsed}
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]"
              role="progressbar"
            >
              <div className="h-full rounded-full bg-foreground/70" style={{ width: `${(elapsed / totalDays) * 100}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
              <div>
                <div className="text-foreground/70">{day(usage.cycle.start)}</div>
                <div className="mt-0.5 normal-case tracking-normal">{t.cycleStart}</div>
              </div>
              <div className="text-end">
                <div className="text-foreground/70">{day(usage.cycle.end)}</div>
                <div className="mt-0.5 normal-case tracking-normal">{t.renewsLabel}</div>
              </div>
            </div>
          </div>
        </div>

        <section className={cn(card, "mt-6")}>
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-base">{t.limits}</h2>
            <span className={eyebrow}>{interpolate(t.resets, { date: day(usage.cycle.end) })}</span>
          </div>
          <ul className="mt-4 flex flex-col gap-5">
            {usage.limits.map((limit) => (
              <UsageMeter key={limit.id} limit={limit} t={t} warnAt={warnAt} />
            ))}
          </ul>
        </section>
      </>
    );
  }

  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      <div className="border-border/60 border-b px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
            <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
          </div>
          {invoiceHref ? (
            <WirefrontLink className={buttonVariants({ variant: "outline", size: "sm" })} href={invoiceHref}>
              {t.viewInvoice}
            </WirefrontLink>
          ) : null}
        </div>
      </div>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">{content}</main>
    </div>
  );
}

function UsageMeter({ limit, warnAt, t }: { limit: UsageLimit; warnAt: number; t: typeof USAGE_MESSAGES }) {
  const format = useFormat();
  const share = limit.used / limit.limit;
  const warn = share >= warnAt;
  const compact = (n: number) => format.number(n, { notation: "compact", maximumFractionDigits: 1 });
  const suffix = limit.unit === "gigabytes" ? ` ${t.gigabytes}` : limit.unit === "per-month" ? ` ${t.perMonthShort}` : "";
  const percent = format.number(Math.min(1, share), { style: "percent", maximumFractionDigits: 0 });
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0 font-medium text-sm">{limit.label}</div>
        <div className="shrink-0 font-mono text-xs">
          <span className="text-foreground">{compact(limit.used)}</span>
          <span className="text-muted-foreground">
            {" "}
            / {compact(limit.limit)}
            {suffix}
          </span>
        </div>
      </div>
      <div
        aria-label={interpolate(t.usageOf, { label: limit.label })}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.round(Math.min(1, share) * 100)}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]"
        role="progressbar"
      >
        <div className={cn("h-full rounded-full transition-all", warn ? "bg-amber-500" : "bg-foreground/70")} style={{ width: `${Math.min(1, share) * 100}%` }} />
      </div>
      <div className="mt-1 flex justify-end text-xs">
        <span className={cn("font-mono text-[10px] uppercase tracking-[0.25em]", warn ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>
          {interpolate(t.used, { percent })}
        </span>
      </div>
    </li>
  );
}

export function UsageDashboard(props: UsageDashboardProps) {
  return (
    <ScreenBoundary name="UsageDashboard">
      <UsageDashboardScreen {...props} />
    </ScreenBoundary>
  );
}
