// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Badge } from "@wirefront/ui/badge";
import { Button, buttonVariants } from "@wirefront/ui/button";
import { Card, CardContent } from "@wirefront/ui/card";
import { cn } from "@wirefront/ui/lib/utils";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
  useWirefront,
  WirefrontLink,
} from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ArrowDownToLineIcon, ExternalLinkIcon } from "lucide-react";

import type { InvoiceCardStatus, InvoiceSummary } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("recentInvoices.<key>"). */
export const RECENT_INVOICES_MESSAGES = {
  title: "Recent invoices",
  count: "{shown} of {total}",
  export: "Export",
  paid: "Paid",
  open: "Open",
  overdue: "Overdue",
  void: "Void",
  dueOn: "Due {date}",
  paidOn: "Paid {date}",
  voidedOn: "Voided {date}",
  lateOne: "1 day late",
  late: "{count} days late",
  openShort: "Open",
  openInvoice: "Open {number}",
  empty: "No invoices yet.",
};

export interface RecentInvoicesProps {
  invoices: InvoiceSummary[];
  /** How many invoices there are in all. */
  total: number;
  /** e.g. "April 2026". */
  periodLabel?: string;
  /** Export all invoices. Hidden when not given. */
  onExport?: Action;
  /** Where "Open" goes. Hidden when not given. */
  invoiceHref?: (invoice: InvoiceSummary) => string;
  className?: string;
}

const STATUS_CLASS: Record<InvoiceCardStatus, string> = {
  paid: "border-success/20 bg-success/10 text-success-foreground",
  open: "border-category-3/20 bg-category-3/10 text-category-3-foreground",
  overdue:
    "border-destructive/20 bg-destructive/10 text-destructive-foreground",
  void: "border-border bg-muted text-muted-foreground",
};

function RecentInvoicesScreen({
  invoices,
  total,
  periodLabel,
  onExport,
  invoiceHref,
  className,
}: RecentInvoicesProps) {
  const t = useMessages("recentInvoices", RECENT_INVOICES_MESSAGES);
  const format = useFormat();
  const { now } = useWirefront();
  const exporter = useAction(onExport ?? (async () => {}));
  const day = (iso: string) =>
    format.date(iso, { month: "short", day: "numeric", timeZone: "UTC" });

  const when = (inv: InvoiceSummary) => {
    if (inv.status === "paid")
      return interpolate(t.paidOn, { date: day(inv.settledAt ?? inv.dueAt) });
    if (inv.status === "void")
      return interpolate(t.voidedOn, { date: day(inv.settledAt ?? inv.dueAt) });
    if (inv.status === "overdue") {
      const late = Math.max(
        1,
        Math.floor((now().getTime() - Date.parse(inv.dueAt)) / 86_400_000)
      );
      return late === 1 ? t.lateOne : interpolate(t.late, { count: late });
    }
    return interpolate(t.dueOn, { date: day(inv.dueAt) });
  };

  return (
    <div
      className={cn(
        "min-h-svh bg-background px-4 py-8 sm:px-6 sm:py-12",
        className
      )}
    >
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-xl">{t.title}</h1>
            <p className="text-muted-foreground text-sm">
              {interpolate(t.count, {
                shown: format.number(invoices.length),
                total: format.number(total),
              })}
              {periodLabel ? <> · {periodLabel}</> : null}
            </p>
          </div>
          {onExport ? (
            <Button
              aria-busy={exporter.isPending()}
              disabled={exporter.isPending()}
              onClick={() => void exporter.run()}
              size="sm"
              variant="outline"
            >
              {exporter.isPending() ? <Spinner /> : <ArrowDownToLineIcon />}
              {t.export}
            </Button>
          ) : null}
        </header>
        {exporter.error ? (
          <p className="mb-3 text-destructive-foreground text-sm" role="alert">
            {exporter.error}
          </p>
        ) : null}

        {invoices.length === 0 ? (
          <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground text-sm">
            {t.empty}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {invoices.map((inv) => (
              <li key={inv.id}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                    {/* The status tile repeats the badge; drop it on phones to give the customer name room. */}
                    <div
                      aria-hidden
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg border font-mono text-[10px] uppercase max-sm:hidden",
                        STATUS_CLASS[inv.status]
                      )}
                    >
                      {inv.number.slice(-2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-mono text-foreground text-sm">
                          {inv.number}
                        </span>
                        <Badge
                          className={cn(
                            "font-mono text-[10px] uppercase tracking-wider",
                            STATUS_CLASS[inv.status]
                          )}
                          variant="outline"
                        >
                          {t[inv.status]}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground text-sm sm:truncate">
                        <span className="block truncate sm:inline">
                          {inv.customer}
                        </span>
                        <span aria-hidden className="mx-1.5 max-sm:hidden">
                          ·
                        </span>
                        <span className="block text-xs sm:inline sm:text-sm">
                          {when(inv)}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-end">
                      <div
                        className={cn(
                          "font-heading font-semibold text-base tabular-nums",
                          inv.status === "void" &&
                            "text-muted-foreground line-through"
                        )}
                      >
                        {format.money(inv.amount, inv.currency)}
                      </div>
                      {invoiceHref ? (
                        <WirefrontLink
                          aria-label={interpolate(t.openInvoice, {
                            number: inv.number,
                          })}
                          className={cn(
                            buttonVariants({ size: "xs", variant: "ghost" }),
                            "-me-2 h-6 text-muted-foreground"
                          )}
                          href={invoiceHref(inv)}
                        >
                          {t.openShort}
                          <ExternalLinkIcon />
                        </WirefrontLink>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function RecentInvoices(props: RecentInvoicesProps) {
  return (
    <ScreenBoundary name="RecentInvoices">
      <RecentInvoicesScreen {...props} />
    </ScreenBoundary>
  );
}
