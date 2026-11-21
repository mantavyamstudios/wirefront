// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@wirefront/ui/input-group";
import { cn } from "@wirefront/ui/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@wirefront/ui/select";
import { Separator } from "@wirefront/ui/separator";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@wirefront/ui/table";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { pageCount, withFilter, withPage, withSearch } from "@wirefront/ui/wirefront/list";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus, ListQuery } from "@wirefront/ui/wirefront/types";
import { ArrowDownLeftIcon, ArrowDownToLineIcon, ArrowUpRightIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, RefreshCcwIcon, SearchIcon } from "lucide-react";
import type { ReactNode } from "react";

import type { PaymentMethod, Transaction, TransactionAccount, TransactionFilters, TransactionsPage, TransactionStatus } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("transactionsTable.<key>"). */
export const TRANSACTIONS_TABLE_MESSAGES = {
  title: "Transactions",
  refresh: "Refresh",
  exportCsv: "Export CSV",
  csv: "CSV",
  inflow: "Inflow",
  outflow: "Outflow",
  net: "Net",
  search: "Search transactions",
  searchPlaceholder: "Search description, ID, counterparty…",
  account: "Account",
  allAccounts: "All accounts",
  direction: "Direction",
  bothDirections: "In + Out",
  incoming: "Incoming",
  outgoing: "Outgoing",
  range: "Date range",
  anyTime: "Any time",
  lastDays: "Last {count} days",
  resultsOne: "1 result",
  resultsOther: "{count} results",
  columnDate: "Date",
  columnDescription: "Description",
  columnCounterparty: "Counterparty",
  columnMethod: "Method",
  columnStatus: "Status",
  columnAmount: "Amount",
  card: "Card",
  ach: "ACH",
  wire: "Wire",
  wallet: "Wallet",
  succeeded: "Succeeded",
  pending: "Pending",
  refunded: "Refunded",
  failed: "Failed",
  received: "Received",
  sent: "Sent",
  fee: "fee {amount}",
  emptyTitle: "No transactions yet",
  emptyDescription: "Money in and out of this account will show up here.",
  noMatchTitle: "No transactions match",
  noMatchDescription: "Try a different search, account or date range.",
  clearFilters: "Clear filters",
  errorTitle: "Couldn’t load transactions",
  retry: "Try again",
  pagination: "Pagination",
  previous: "Previous page",
  next: "Next page",
  showing: "{from}–{to} of {total}",
};

export type TransactionsListQuery = ListQuery<TransactionFilters>;

export interface TransactionsTableProps {
  /** The current page, its total and the inflow/outflow summary. Leave out while loading. */
  page?: TransactionsPage;
  /** Search, filters and page; send it to your API (see `TransactionsQuery` in schema.ts). */
  query: TransactionsListQuery;
  onQueryChange: (query: TransactionsListQuery) => void;
  /** Accounts to filter by (listAccounts). The filter hides with fewer than two. */
  accounts?: TransactionAccount[];
  /** "Date range" choices in days. */
  rangeOptions?: number[];
  /** "loading" shows skeleton rows; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** A line under the title, e.g. the bank and account. */
  subtitle?: string;
  /** Refetch. Hidden when not given. */
  onRefresh?: () => void;
  /** Export the matching transactions. Hidden when not given. */
  onExport?: Action<TransactionsListQuery>;
  className?: string;
}

const STATUS_CLASS: Record<TransactionStatus, string> = {
  succeeded: "border-success/30 bg-success/10 text-success-foreground",
  pending: "border-warning/30 bg-warning/10 text-warning-foreground",
  refunded: "border-border bg-muted text-muted-foreground",
  failed: "border-destructive/30 bg-destructive/10 text-destructive-foreground",
};
const SKELETON_ROWS = ["s1", "s2", "s3", "s4", "s5"];
const ALL = "all";
const tag = "h-4.5 rounded-sm px-1 text-[0.625rem]";

function TransactionsTableScreen({
  page,
  query,
  onQueryChange,
  accounts = [],
  rangeOptions = [7, 30, 90],
  status = "ready",
  error,
  onRetry,
  subtitle,
  onRefresh,
  onExport,
  className,
}: TransactionsTableProps) {
  const t = useMessages("transactionsTable", TRANSACTIONS_TABLE_MESSAGES);
  const format = useFormat();
  const exporter = useAction(onExport ?? (async () => {}));
  const items = page?.items ?? [];
  const total = page?.total ?? 0;
  const pages = pageCount(query, total);
  const from = total === 0 ? 0 : (query.page - 1) * query.pageSize + 1;
  const to = Math.min(query.page * query.pageSize, total);
  const filters = query.filters ?? {};
  const filtered = Boolean(query.search) || Object.keys(filters).length > 0;
  const signed = (amount: number, currency: string) => format.money(amount, currency, { signDisplay: "exceptZero" });
  const when = (iso: string) => format.date(iso, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const accountItems = [{ value: ALL, label: t.allAccounts }, ...accounts.map((a) => ({ value: a.id, label: a.label }))];
  const directionItems = [
    { value: ALL, label: t.bothDirections },
    { value: "in", label: t.incoming },
    { value: "out", label: t.outgoing },
  ];
  const rangeItems = [{ value: ALL, label: t.anyTime }, ...rangeOptions.map((days) => ({ value: String(days), label: interpolate(t.lastDays, { count: days }) }))];

  const select = (label: string, items: { value: string; label: string }[], value: string, onChange: (value: string) => void, width: string, icon?: ReactNode) => (
    <Select items={items} onValueChange={(v) => onChange(v ?? ALL)} value={value}>
      <SelectTrigger aria-label={label} className={cn(width, "max-sm:w-[calc(50%-0.25rem)] pointer-coarse:h-10")} size="sm">
        {icon}
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start">
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

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
            <div className="flex items-center gap-2">
              <Skeleton className="size-7 rounded-full motion-reduce:animate-none" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-40 motion-reduce:animate-none" />
                <Skeleton className="h-3 w-24 motion-reduce:animate-none" />
              </div>
            </div>
            <Skeleton className="h-4 w-20 motion-reduce:animate-none" />
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
          <Button className="mt-4" onClick={() => onQueryChange({ ...query, search: undefined, filters: undefined, page: 1 })} size="sm" variant="outline">
            {t.clearFilters}
          </Button>,
        )
      : message(t.emptyTitle, t.emptyDescription);
  } else {
    body = items.map((tx: Transaction) => {
      const voided = tx.status === "failed" || tx.status === "refunded";
      const amount = signed(tx.direction === "in" ? tx.amount : -tx.amount, tx.currency);
      return (
        <TableRow key={tx.id}>
          <TableCell className="ps-4 text-muted-foreground tabular-nums max-sm:hidden">{when(tx.occurredAt)}</TableCell>
          <TableCell className="w-full max-w-0 max-sm:ps-4 sm:w-auto sm:max-w-none">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full",
                  tx.direction === "in" ? "bg-category-2/10 text-category-2-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {tx.direction === "in" ? <ArrowDownLeftIcon aria-label={t.received} className="size-3.5" role="img" /> : <ArrowUpRightIcon aria-label={t.sent} className="size-3.5" role="img" />}
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium">{tx.description}</div>
                <div className="truncate font-mono text-muted-foreground text-xs">
                  <span className="sm:hidden">{when(tx.occurredAt)} · </span>
                  {tx.id}
                </div>
                <div className="truncate text-muted-foreground text-xs lg:hidden">{tx.counterparty}</div>
              </div>
            </div>
          </TableCell>
          <TableCell className="text-muted-foreground max-lg:hidden">{tx.counterparty}</TableCell>
          <TableCell className="max-xl:hidden">
            <Badge className={cn(tag, "font-mono text-[10px]")} variant="outline">
              {t[tx.method as PaymentMethod]}
            </Badge>
          </TableCell>
          <TableCell className="max-sm:hidden">
            <Badge className={STATUS_CLASS[tx.status]} variant="outline">
              {t[tx.status]}
            </Badge>
          </TableCell>
          <TableCell className="pe-4 text-end">
            <div className={cn("font-mono tabular-nums", voided ? "text-muted-foreground line-through" : tx.direction === "in" ? "text-category-2-foreground" : "text-foreground")}>{amount}</div>
            {tx.fee ? <div className="font-mono text-[10px] text-muted-foreground">{interpolate(t.fee, { amount: format.money(tx.fee, tx.currency) })}</div> : null}
            {tx.status !== "succeeded" ? (
              <Badge className={cn(tag, "mt-1 sm:hidden", STATUS_CLASS[tx.status])} variant="outline">
                {t[tx.status]}
              </Badge>
            ) : null}
          </TableCell>
        </TableRow>
      );
    });
  }

  const summary = page?.summary;
  const tile = (label: string, value: number, positive?: boolean) => (
    <div className="flex items-baseline justify-between gap-2 rounded-xl border bg-card px-4 py-3 shadow-xs/5 min-[480px]:block min-[480px]:p-4">
      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{label}</div>
      <div className={cn("font-heading font-semibold text-xl tabular-nums min-[480px]:mt-1.5 lg:text-2xl", positive ? "text-category-2-foreground" : "text-foreground")}>
        {summary ? signed(value, summary.currency) : <Skeleton className="h-6 w-24 motion-reduce:animate-none" />}
      </div>
    </div>
  );

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-12", className)}>
      <div className="mx-auto max-w-6xl">
        <header className="mb-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-heading text-xl">{t.title}</h1>
            {subtitle ? <p className="text-muted-foreground text-sm">{subtitle}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onRefresh ? (
              <Button aria-label={t.refresh} className="pointer-coarse:h-10" onClick={onRefresh} size="sm" variant="ghost">
                <RefreshCcwIcon />
                <span aria-hidden className="max-sm:hidden">
                  {t.refresh}
                </span>
              </Button>
            ) : null}
            {onExport ? (
              <Button
                aria-busy={exporter.isPending()}
                aria-label={t.exportCsv}
                className="pointer-coarse:h-10"
                disabled={exporter.isPending()}
                onClick={() => void exporter.run(query)}
                size="sm"
                variant="outline"
              >
                {exporter.isPending() ? <Spinner /> : <ArrowDownToLineIcon />}
                <span aria-hidden>{t.csv}</span>
              </Button>
            ) : null}
          </div>
        </header>

        {exporter.error ? (
          <p className="mb-3 text-destructive-foreground text-sm" role="alert">
            {exporter.error}
          </p>
        ) : null}

        {status !== "error" ? (
          <div className="mb-4 grid grid-cols-1 gap-2 min-[480px]:grid-cols-3 sm:gap-3">
            {tile(t.inflow, summary?.inflow ?? 0, true)}
            {tile(t.outflow, -(summary?.outflow ?? 0))}
            {tile(t.net, (summary?.inflow ?? 0) - (summary?.outflow ?? 0))}
          </div>
        ) : null}

        <div className="rounded-xl border bg-card shadow-xs/5">
          <div className="flex flex-wrap items-center gap-2 border-b p-3">
            <InputGroup className="w-full sm:w-64">
              <InputGroupAddon>
                <SearchIcon aria-hidden className="size-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                aria-label={t.search}
                onChange={(e) => onQueryChange(withSearch(query, e.target.value))}
                placeholder={t.searchPlaceholder}
                type="search"
                value={query.search ?? ""}
              />
            </InputGroup>
            <Separator className="mx-1 h-6 max-sm:hidden" orientation="vertical" />
            {accounts.length > 1
              ? select(t.account, accountItems, filters.account ?? ALL, (v) => onQueryChange(withFilter(query, "account", v === ALL ? undefined : v)), "w-36")
              : null}
            {select(t.direction, directionItems, filters.direction ?? ALL, (v) => onQueryChange(withFilter(query, "direction", v === ALL ? undefined : v)), "w-32")}
            {select(
              t.range,
              rangeItems,
              filters.withinDays ? String(filters.withinDays) : ALL,
              (v) => onQueryChange(withFilter(query, "withinDays", v === ALL ? undefined : Number(v))),
              "w-40",
              <CalendarIcon aria-hidden className="text-muted-foreground" />,
            )}
            {status === "ready" ? (
              <span aria-live="polite" className="ms-auto font-mono text-[11px] text-muted-foreground">
                {total === 1 ? t.resultsOne : interpolate(t.resultsOther, { count: format.number(total) })}
              </span>
            ) : null}
          </div>

          {/*
            Priority columns: phones see Description (date, counterparty and
            status folded in) and Amount; Date and Status return at sm,
            Counterparty at lg, Method at xl.
          */}
          <Table aria-busy={status === "loading"}>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-4 max-sm:hidden">{t.columnDate}</TableHead>
                <TableHead className="max-sm:ps-4">{t.columnDescription}</TableHead>
                <TableHead className="max-lg:hidden">{t.columnCounterparty}</TableHead>
                <TableHead className="max-xl:hidden">{t.columnMethod}</TableHead>
                <TableHead className="max-sm:hidden">{t.columnStatus}</TableHead>
                <TableHead className="pe-4 text-end">{t.columnAmount}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{body}</TableBody>
          </Table>

          {status === "ready" && total > 0 ? (
            <nav aria-label={t.pagination} className="flex items-center justify-between gap-2 border-t p-3 text-muted-foreground text-xs">
              <span className="tabular-nums">{interpolate(t.showing, { from, to, total })}</span>
              {pages > 1 ? (
                <div className="flex items-center gap-2">
                  <Button aria-label={t.previous} disabled={query.page <= 1} onClick={() => onQueryChange(withPage(query, query.page - 1, total))} size="icon-sm" variant="outline">
                    <ChevronLeftIcon />
                  </Button>
                  <Button aria-label={t.next} disabled={query.page >= pages} onClick={() => onQueryChange(withPage(query, query.page + 1, total))} size="icon-sm" variant="outline">
                    <ChevronRightIcon />
                  </Button>
                </div>
              ) : null}
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function TransactionsTable(props: TransactionsTableProps) {
  return (
    <ScreenBoundary name="TransactionsTable">
      <TransactionsTableScreen {...props} />
    </ScreenBoundary>
  );
}
