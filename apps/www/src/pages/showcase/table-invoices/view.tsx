// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Badge } from "@wirefront/ui/badge";
import { Button, buttonVariants } from "@wirefront/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@wirefront/ui/input-group";
import { cn } from "@wirefront/ui/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@wirefront/ui/select";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@wirefront/ui/table";
import { useAction } from "@wirefront/ui/wirefront/action";
import { pageCount, toggleSort, withFilter, withPage, withSearch } from "@wirefront/ui/wirefront/list";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus, ListQuery } from "@wirefront/ui/wirefront/types";
import { ArrowDownIcon, ArrowDownToLineIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, SearchIcon } from "lucide-react";
import type { ReactNode } from "react";

import { type Invoice, InvoiceStatus, type InvoicesPage } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("invoicesTable.<key>"). */
export const INVOICES_TABLE_MESSAGES = {
  title: "Invoices",
  countOne: "1 invoice",
  countOther: "{count} invoices",
  search: "Search invoices",
  allStatuses: "All statuses",
  status: "Status",
  paid: "Paid",
  open: "Open",
  overdue: "Overdue",
  void: "Void",
  export: "Export",
  newInvoice: "New invoice",
  columnInvoice: "Invoice",
  columnCustomer: "Customer",
  columnIssued: "Issued",
  columnDue: "Due",
  columnStatus: "Status",
  columnAmount: "Amount",
  due: "due {date}",
  noDueDate: "—",
  outstanding: "Outstanding",
  outstandingNote: "(open and overdue)",
  emptyTitle: "No invoices yet",
  emptyDescription: "Invoices you send will show up here.",
  noMatchTitle: "No invoices match",
  noMatchDescription: "Try a different customer, number or status.",
  clearFilters: "Clear filters",
  errorTitle: "Couldn’t load invoices",
  retry: "Try again",
  previous: "Previous page",
  next: "Next page",
  range: "{from}–{to} of {total}",
};

export type InvoicesListQuery = ListQuery<{ status: InvoiceStatus }>;

export interface InvoicesTableProps {
  /** The current page, its total and the outstanding amount across all matches. Leave out while loading. */
  page?: InvoicesPage;
  /** Search, status filter, sort and page; send it to your API (see `InvoicesQuery` in schema.ts). */
  query: InvoicesListQuery;
  onQueryChange: (query: InvoicesListQuery) => void;
  /** "loading" shows skeleton rows; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Export the invoices matching the query. The Export button only shows when this is given. */
  onExport?: Action<InvoicesListQuery>;
  /** Where "New invoice" goes. Hidden when not given. */
  newInvoiceHref?: string;
  /** Where an invoice's number links to. Plain text when not given. */
  invoiceHref?: (invoice: Invoice) => string;
  className?: string;
}

const STATUS_STYLE: Record<InvoiceStatus, { className: string; dot: string }> = {
  paid: { className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  open: { className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  overdue: { className: "border-destructive/20 bg-destructive/10 text-destructive-foreground", dot: "bg-destructive" },
  void: { className: "border-border bg-muted text-muted-foreground", dot: "bg-muted-foreground/50" },
};
const SKELETON_ROWS = ["s1", "s2", "s3", "s4", "s5"];
const FOOTER_SPANS = [
  [1, "sm:hidden"],
  [3, "max-sm:hidden md:hidden"],
  [5, "max-md:hidden"],
] as const;

export function InvoicesTable({
  page,
  query,
  onQueryChange,
  status = "ready",
  error,
  onRetry,
  onExport,
  newInvoiceHref,
  invoiceHref,
  className,
}: InvoicesTableProps) {
  const t = useMessages("invoicesTable", INVOICES_TABLE_MESSAGES);
  const format = useFormat();
  const exporter = useAction(onExport ?? (async () => {}));
  const items = page?.items ?? [];
  const total = page?.total ?? 0;
  const filtered = Boolean(query.search || query.filters?.status);
  const pages = pageCount(query, total);
  const from = total === 0 ? 0 : (query.page - 1) * query.pageSize + 1;
  const to = Math.min(query.page * query.pageSize, total);
  const money = (amount: number, currency: string) => format.money(amount, currency);
  const day = (iso: string) => format.date(iso, { month: "short", day: "numeric", timeZone: "UTC" });

  const sortHead = (id: "issuedAt" | "dueAt" | "amount", label: string, cellClass?: string) => {
    const active = query.sort?.id === id ? query.sort.direction : undefined;
    return (
      <TableHead aria-sort={active === "asc" ? "ascending" : active === "desc" ? "descending" : "none"} className={cellClass}>
        <button
          className="-mx-1 inline-flex items-center gap-1 rounded-sm px-1 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onQueryChange(toggleSort(query, id))}
          type="button"
        >
          {label}
          {active === "asc" ? <ArrowUpIcon className="size-3" /> : active === "desc" ? <ArrowDownIcon className="size-3" /> : null}
        </button>
      </TableHead>
    );
  };

  const message = (title: string, description?: string, action?: ReactNode) => (
    <TableRow>
      <TableCell className="whitespace-normal py-12 text-center" colSpan={6}>
        <p className="font-medium">{title}</p>
        {description ? <p className="mt-1 text-muted-foreground text-sm">{description}</p> : null}
        {action}
      </TableCell>
    </TableRow>
  );

  let body: ReactNode;
  if (status === "loading") {
    body = SKELETON_ROWS.map((key) => (
      <TableRow key={key}>
        <TableCell className="ps-4" colSpan={6}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-52" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        </TableCell>
      </TableRow>
    ));
  } else if (status === "error") {
    body = message(
      t.errorTitle,
      error,
      onRetry ? (
        <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
          {t.retry}
        </Button>
      ) : null,
    );
  } else if (items.length === 0) {
    body = filtered
      ? message(
          t.noMatchTitle,
          t.noMatchDescription,
          <Button className="mt-4" onClick={() => onQueryChange(withFilter(withSearch(query, ""), "status", undefined))} size="sm" variant="outline">
            {t.clearFilters}
          </Button>,
        )
      : message(t.emptyTitle, t.emptyDescription);
  } else {
    body = items.map((inv) => {
      const style = STATUS_STYLE[inv.status];
      const badge = (
        <Badge className={cn("gap-1.5", style.className)} variant="outline">
          <span className={cn("size-1.5 rounded-full", style.dot)} />
          {t[inv.status]}
        </Badge>
      );
      const number = invoiceHref ? (
        <WirefrontLink className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring" href={invoiceHref(inv)}>
          {inv.number}
        </WirefrontLink>
      ) : (
        inv.number
      );
      const due = inv.dueAt ? day(inv.dueAt) : t.noDueDate;
      return (
        <TableRow key={inv.id}>
          <TableCell className="ps-4 font-mono text-sm max-sm:hidden">{number}</TableCell>
          <TableCell className="w-full max-w-0 max-sm:ps-4 sm:w-auto sm:max-w-none">
            <div className="truncate font-medium">{inv.customer}</div>
            <div className="truncate text-muted-foreground text-xs">{inv.email}</div>
            <div className="mt-0.5 font-mono text-[11px] text-muted-foreground md:hidden">
              <span className="sm:hidden">{number} · </span>
              {interpolate(t.due, { date: due })}
            </div>
          </TableCell>
          <TableCell className="text-muted-foreground max-md:hidden">{day(inv.issuedAt)}</TableCell>
          <TableCell className="text-muted-foreground max-md:hidden">{due}</TableCell>
          <TableCell className="max-sm:hidden">{badge}</TableCell>
          <TableCell className="pe-4 text-right font-mono tabular-nums">
            {inv.status === "void" ? (
              <span className="text-muted-foreground line-through">{money(inv.amount, inv.currency)}</span>
            ) : (
              money(inv.amount, inv.currency)
            )}
            <div className="mt-1 flex justify-end font-sans sm:hidden">{badge}</div>
          </TableCell>
        </TableRow>
      );
    });
  }

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-12", className)}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <h1 className="font-heading text-xl">{t.title}</h1>
            <p className="text-muted-foreground text-sm">
              {total === 1 ? t.countOne : interpolate(t.countOther, { count: format.number(total) })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onExport ? (
              <Button
                aria-busy={exporter.isPending()}
                aria-label={t.export}
                className="pointer-coarse:h-10"
                disabled={exporter.isPending()}
                onClick={() => void exporter.run(query)}
                size="sm"
                variant="outline"
              >
                {exporter.isPending() ? <Spinner /> : <ArrowDownToLineIcon />}
                <span className="max-sm:sr-only">{t.export}</span>
              </Button>
            ) : null}
            {newInvoiceHref ? (
              <WirefrontLink className={cn(buttonVariants({ size: "sm" }), "pointer-coarse:h-10")} href={newInvoiceHref}>
                <PlusIcon />
                {t.newInvoice}
              </WirefrontLink>
            ) : null}
          </div>
        </header>

        <div className="mb-3 flex flex-col gap-2 sm:flex-row">
          <InputGroup className="sm:max-w-xs">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              aria-label={t.search}
              onChange={(e) => onQueryChange(withSearch(query, e.target.value))}
              placeholder={t.search}
              type="search"
              value={query.search ?? ""}
            />
          </InputGroup>
          <Select
            items={[{ label: t.allStatuses, value: "all" }, ...InvoiceStatus.options.map((s) => ({ label: t[s], value: s }))]}
            onValueChange={(v) => onQueryChange(withFilter(query, "status", v === "all" ? undefined : v))}
            value={query.filters?.status ?? "all"}
          >
            <SelectTrigger aria-label={t.status} className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="all">{t.allStatuses}</SelectItem>
              {InvoiceStatus.options.map((s) => (
                <SelectItem key={s} value={s}>
                  {t[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {exporter.error ? (
          <p className="mb-3 text-destructive-foreground text-sm" role="alert">
            {exporter.error}
          </p>
        ) : null}

        {/*
          Priority columns: phones see Customer + Amount (invoice no., due date
          and status move into those cells); Invoice/Status return at sm,
          Issued/Due at md.
        */}
        <div className="rounded-xl border bg-card shadow-xs/5">
          <Table aria-busy={status === "loading"}>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-4 max-sm:hidden">{t.columnInvoice}</TableHead>
                <TableHead className="max-sm:ps-4">{t.columnCustomer}</TableHead>
                {sortHead("issuedAt", t.columnIssued, "max-md:hidden")}
                {sortHead("dueAt", t.columnDue, "max-md:hidden")}
                <TableHead className="max-sm:hidden">{t.columnStatus}</TableHead>
                {sortHead("amount", t.columnAmount, "pe-4 text-right")}
              </TableRow>
            </TableHeader>
            <TableBody>{body}</TableBody>
            {status === "ready" && page && items.length ? (
              <TableFooter>
                {/* One footer row per breakpoint so colSpan matches the visible columns. */}
                {FOOTER_SPANS.map(([span, cls]) => (
                  <TableRow className={cls} key={span}>
                    <TableCell className="ps-4" colSpan={span}>
                      {t.outstanding} <span className="max-sm:hidden">{t.outstandingNote}</span>
                    </TableCell>
                    <TableCell className="pe-4 text-right font-mono tabular-nums">
                      {money(page.outstanding.amount, page.outstanding.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableFooter>
            ) : null}
          </Table>
        </div>

        {status === "ready" && pages > 1 ? (
          <nav aria-label="Pagination" className="mt-3 flex items-center justify-end gap-2 text-muted-foreground text-sm">
            <span className="tabular-nums">{interpolate(t.range, { from, to, total })}</span>
            <Button
              aria-label={t.previous}
              disabled={query.page <= 1}
              onClick={() => onQueryChange(withPage(query, query.page - 1, total))}
              size="icon-sm"
              variant="outline"
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              aria-label={t.next}
              disabled={query.page >= pages}
              onClick={() => onQueryChange(withPage(query, query.page + 1, total))}
              size="icon-sm"
              variant="outline"
            >
              <ChevronRightIcon />
            </Button>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
