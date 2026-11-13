// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@wirefront/ui/alert-dialog";
import { Button, buttonVariants } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Separator } from "@wirefront/ui/separator";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { ArrowDownToLineIcon, CheckCircle2Icon, CircleAlertIcon, CircleDollarSignIcon, CreditCardIcon, ExternalLinkIcon, ZapIcon } from "lucide-react";
import { type ReactNode, useState } from "react";

import type { Billing } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("billing.<key>"). */
export const BILLING_MESSAGES = {
  eyebrow: "Settings · Billing",
  title: "Billing",
  subtitle: "Plan, payment method, and invoice history.",
  month: "Monthly",
  year: "Annual",
  active: "Active · renews {date}",
  trialing: "Trial · ends {date}",
  past_due: "Payment failed · update your card",
  canceled: "Canceled · ends {date}",
  perMonth: "per month",
  comparePlans: "Compare plans",
  cancelPlan: "Cancel plan",
  upgrade: "Upgrade",
  cancelTitle: "Cancel your plan?",
  cancelDescription: "You keep {plan} until {date}. After that the workspace moves to the free plan.",
  keepPlan: "Keep plan",
  confirmCancel: "Cancel plan",
  paymentMethod: "Payment method",
  update: "Update",
  noPaymentMethod: "No payment method on file.",
  expires: "Expires {month}/{year}",
  default: "Default",
  credits: "Credits",
  creditsNote: "Auto-applied to next invoice",
  taxId: "Tax ID",
  noTaxId: "None",
  currency: "Currency",
  currencyNote: "Set per workspace",
  invoices: "Invoices",
  exportAll: "Export all",
  noInvoices: "No invoices yet.",
  paid: "Paid",
  open: "Open",
  void: "Void",
  openInvoice: "Open invoice {number}",
  errorTitle: "Couldn’t load billing",
  retry: "Try again",
};

export interface BillingSettingsProps {
  /** Leave out while loading. */
  billing?: Billing;
  /** "loading" shows skeletons; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Your billing provider's customer portal (update card, tax details). "Update" is hidden when not given. */
  portalHref?: string;
  comparePlansHref?: string;
  upgradeHref?: string;
  /** Cancel at period end, after confirmation. "Cancel plan" is hidden when not given. */
  onCancelPlan?: Action;
  /** Send every invoice to the billing contact. "Export all" is hidden when not given. */
  onExportInvoices?: Action;
  className?: string;
}

const section = "rounded-xl border border-border/60 bg-background/40";
const eyebrow = "font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]";

export function BillingSettings({
  billing,
  status = "ready",
  error,
  onRetry,
  portalHref,
  comparePlansHref,
  upgradeHref,
  onCancelPlan,
  onExportInvoices,
  className,
}: BillingSettingsProps) {
  const t = useMessages("billing", BILLING_MESSAGES);
  const format = useFormat();
  const [confirming, setConfirming] = useState(false);
  const cancel = useAction(onCancelPlan ?? (async () => {}), { onSuccess: () => setConfirming(false) });
  const exporter = useAction(onExportInvoices ?? (async () => {}));
  const day = (iso: string, long = false) =>
    format.date(iso, long ? { dateStyle: "medium", timeZone: "UTC" } : { month: "short", day: "numeric", timeZone: "UTC" });
  const actionError = cancel.error ?? exporter.error;

  let content: ReactNode;
  if (status === "error") {
    content = (
      <div className={cn(section, "mt-8 p-8 text-center")}>
        <p className="font-medium">{t.errorTitle}</p>
        {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
        {onRetry ? (
          <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
            {t.retry}
          </Button>
        ) : null}
      </div>
    );
  } else if (status === "loading" || !billing) {
    content = (
      <div aria-busy="true" className="mt-8 flex flex-col gap-3">
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    );
  } else {
    const { plan } = billing;
    const healthy = plan.status === "active" || plan.status === "trialing";
    content = (
      <>
        {actionError ? (
          <p className="mt-6 text-destructive-foreground text-sm" role="alert">
            {actionError}
          </p>
        ) : null}
        <section className={cn(section, "mt-8 overflow-hidden")}>
          <div className="flex flex-wrap items-start justify-between gap-4 p-4 sm:items-center sm:gap-6 sm:p-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-2xl">{plan.name}</h2>
                <span className="rounded bg-foreground/[0.08] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em]">{t[plan.interval]}</span>
              </div>
              <p className="mt-1 text-muted-foreground text-sm">{plan.summary}</p>
              <div
                className={cn(
                  "mt-3 inline-flex items-center gap-2 rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em]",
                  healthy ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-destructive/10 text-destructive-foreground",
                )}
              >
                {healthy ? <CheckCircle2Icon className="size-3" /> : <CircleAlertIcon className="size-3" />}
                {interpolate(t[plan.status], { date: day(plan.periodEnd) })}
              </div>
            </div>
            <div className="sm:text-right">
              <div className="font-heading text-3xl">
                {format.money(billing.monthlyPrice.amount, billing.monthlyPrice.currency, { maximumFractionDigits: 0 })}
              </div>
              <div className={eyebrow}>{t.perMonth}</div>
            </div>
          </div>
          {comparePlansHref || upgradeHref || (onCancelPlan && plan.status !== "canceled") ? (
            <>
              <Separator />
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:gap-3 sm:p-4">
                {comparePlansHref ? (
                  <WirefrontLink className={buttonVariants({ variant: "ghost", size: "sm" })} href={comparePlansHref}>
                    {t.comparePlans}
                  </WirefrontLink>
                ) : (
                  <span />
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {onCancelPlan && plan.status !== "canceled" ? (
                    <AlertDialog onOpenChange={(open) => !cancel.isPending() && setConfirming(open)} open={confirming}>
                      <AlertDialogTrigger render={<Button size="sm" variant="outline" />}>{t.cancelPlan}</AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t.cancelTitle}</AlertDialogTitle>
                          <AlertDialogDescription>{interpolate(t.cancelDescription, { plan: plan.name, date: day(plan.periodEnd, true) })}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={cancel.isPending()}>{t.keepPlan}</AlertDialogCancel>
                          <Button
                            aria-busy={cancel.isPending()}
                            className="text-destructive-foreground"
                            disabled={cancel.isPending()}
                            onClick={() => void cancel.run()}
                            variant="destructive"
                          >
                            {cancel.isPending() ? <Spinner data-icon="inline-start" /> : null}
                            {t.confirmCancel}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : null}
                  {upgradeHref ? (
                    <WirefrontLink className={buttonVariants({ size: "sm" })} href={upgradeHref}>
                      <ZapIcon />
                      {t.upgrade}
                    </WirefrontLink>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </section>

        <section className={cn(section, "mt-3 p-4 sm:p-6")}>
          <header className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-base">{t.paymentMethod}</h2>
            {portalHref ? (
              <WirefrontLink className={buttonVariants({ variant: "ghost", size: "sm" })} href={portalHref}>
                {t.update}
              </WirefrontLink>
            ) : null}
          </header>
          {billing.paymentMethod ? (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-3 sm:gap-4 sm:p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
                <CreditCardIcon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="font-medium">{billing.paymentMethod.brand}</span>
                  <span className="font-mono text-muted-foreground text-sm">•••• {billing.paymentMethod.last4}</span>
                </div>
                <p className="mt-0.5 truncate text-muted-foreground text-xs">
                  {interpolate(t.expires, {
                    month: String(billing.paymentMethod.expMonth).padStart(2, "0"),
                    year: String(billing.paymentMethod.expYear).slice(-2),
                  })}
                  {billing.paymentMethod.email ? ` · ${billing.paymentMethod.email}` : null}
                </p>
              </div>
              <span className="shrink-0 rounded bg-foreground/[0.06] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.25em]">{t.default}</span>
            </div>
          ) : (
            <p className="mt-4 text-muted-foreground text-sm">{t.noPaymentMethod}</p>
          )}
        </section>

        <section className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Fact label={t.credits} note={t.creditsNote} value={format.money(billing.credits.amount, billing.credits.currency)} />
          <Fact label={t.taxId} note={billing.taxId?.value ?? ""} value={billing.taxId?.type ?? t.noTaxId} />
          <Fact label={t.currency} note={t.currencyNote} value={billing.monthlyPrice.currency} />
        </section>

        <section className={cn(section, "mt-3")}>
          <header className="flex items-center justify-between gap-3 p-4 sm:p-5">
            <h2 className="font-heading text-base">{t.invoices}</h2>
            {onExportInvoices ? (
              <Button aria-busy={exporter.isPending()} disabled={exporter.isPending()} onClick={() => void exporter.run()} size="sm" variant="ghost">
                {exporter.isPending() ? <Spinner /> : <ArrowDownToLineIcon />}
                {t.exportAll}
              </Button>
            ) : null}
          </header>
          <Separator />
          {billing.invoices.length ? (
            <ul>
              {billing.invoices.map((inv) => (
                <li className="flex items-center gap-3 border-border/40 border-b px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-foreground/[0.02] sm:gap-4 sm:px-5" key={inv.id}>
                  <span className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-4">
                    <span className="block font-mono text-[12px] text-muted-foreground">{inv.number}</span>
                    <span className="block truncate text-muted-foreground max-sm:text-xs sm:flex-1">{day(inv.issuedAt, true)}</span>
                  </span>
                  <span className="shrink-0 font-mono">{format.money(inv.total.amount, inv.total.currency)}</span>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] max-sm:hidden",
                      inv.status === "paid" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {inv.status === "paid" ? <CheckCircle2Icon className="size-2.5" /> : null}
                    {t[inv.status]}
                  </span>
                  {inv.url ? (
                    <a
                      aria-label={interpolate(t.openInvoice, { number: inv.number })}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground pointer-coarse:p-3 sm:ml-2"
                      href={inv.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ExternalLinkIcon className="size-3.5" />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-5 text-muted-foreground text-sm">{t.noInvoices}</p>
          )}
        </section>
      </>
    );
  }

  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
        <h1 className="mt-1 font-heading text-3xl">{t.title}</h1>
        <p className="mt-1.5 text-muted-foreground text-sm">{t.subtitle}</p>
        {content}
      </div>
    </div>
  );
}

function Fact({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-4">
      <div className="flex items-center justify-between">
        <div className={eyebrow}>{label}</div>
        <CircleDollarSignIcon className="size-3.5 opacity-40" />
      </div>
      <div className="mt-2 font-heading text-xl">{value}</div>
      {note ? <div className="mt-1 text-muted-foreground text-xs">{note}</div> : null}
    </div>
  );
}
