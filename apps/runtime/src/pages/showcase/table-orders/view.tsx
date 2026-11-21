// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import { Checkbox } from "@wirefront/ui/checkbox";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@wirefront/ui/table";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { pageCount, toggleSort, useSelection, withPage } from "@wirefront/ui/wirefront/list";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus, ListQuery } from "@wirefront/ui/wirefront/types";
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, CircleDotIcon, type LucideIcon, PackageIcon, TruckIcon } from "lucide-react";
import { type ReactNode, useState } from "react";

import type { Order, OrderStage, OrdersPage } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("ordersTable.<key>"). */
export const ORDERS_TABLE_MESSAGES = {
  title: "Orders",
  countOne: "1 order",
  countOther: "{count} orders",
  selectAll: "Select all",
  select: "Select {number}",
  selected: "{count} selected",
  bulkActions: "Bulk actions",
  markShipped: "Mark shipped",
  printLabels: "Print labels",
  labelsReady: "Labels ready:",
  downloadLabels: "Download",
  columnOrder: "Order",
  columnCustomer: "Customer",
  columnItems: "Items",
  columnStatus: "Status",
  columnCarrier: "Carrier",
  columnTotal: "Total",
  itemsOne: "1 item",
  itemsOther: "{count} items",
  eta: "ETA {date}",
  noEta: "—",
  noCarrier: "—",
  stage: "Stage: {stage}",
  ordered: "Ordered",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  emptyTitle: "No orders yet",
  emptyDescription: "Orders will show up here as customers check out.",
  errorTitle: "Couldn’t load orders",
  retry: "Try again",
  pagination: "Pagination",
  previous: "Previous page",
  next: "Next page",
  range: "{from}–{to} of {total}",
};

export type OrdersListQuery = ListQuery;

export interface OrdersTableProps {
  /** The current page and its total. Leave out while loading. */
  page?: OrdersPage;
  /** Sort and page; send it to your API (see `OrdersQuery` in schema.ts). */
  query: OrdersListQuery;
  onQueryChange: (query: OrdersListQuery) => void;
  /** "loading" shows skeleton rows; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Mark the selected orders shipped (markShipped, with { ids }). Refetch the page afterwards. Hidden without it. */
  onMarkShipped?: Action<string[]>;
  /** Create labels for the selected orders (printLabels); the screen links the returned file. Hidden without it. */
  onPrintLabels?: Action<string[], { url: string }>;
  /** Where an order number links to. Plain text when not given. */
  orderHref?: (order: Order) => string;
  className?: string;
}

const STAGES: OrderStage[] = ["ordered", "packed", "shipped", "delivered"];
const STAGE_ICON: Record<OrderStage, LucideIcon> = { ordered: CircleDotIcon, packed: PackageIcon, shipped: TruckIcon, delivered: CheckIcon };
const SKELETON_ROWS = ["s1", "s2", "s3", "s4", "s5"];

function OrdersTableScreen({ page, query, onQueryChange, status = "ready", error, onRetry, onMarkShipped, onPrintLabels, orderHref, className }: OrdersTableProps) {
  const t = useMessages("ordersTable", ORDERS_TABLE_MESSAGES);
  const format = useFormat();
  const items = page?.items ?? [];
  const total = page?.total ?? 0;
  const pages = pageCount(query, total);
  const from = total === 0 ? 0 : (query.page - 1) * query.pageSize + 1;
  const to = Math.min(query.page * query.pageSize, total);
  const selectable = Boolean(onMarkShipped || onPrintLabels);
  const selection = useSelection(items.map((o) => o.id));
  const [labelsUrl, setLabelsUrl] = useState<string>();
  const ship = useAction(onMarkShipped ?? (async () => {}), { onSuccess: () => selection.clear() });
  const labels = useAction(onPrintLabels ?? (async () => ({ ok: true as const, data: { url: "" } })), { onSuccess: (data) => setLabelsUrl(data.url) });
  const ids = [...selection.selected];
  const count = ids.length;
  const columns = selectable ? 7 : 6;

  const stageBadge = (stage: OrderStage) => (
    <Badge className={stage === "delivered" ? "border-success/30 text-success-foreground" : undefined} variant="outline">
      {t[stage]}
    </Badge>
  );

  const stageTrack = (stage: OrderStage) => {
    const at = STAGES.indexOf(stage);
    return (
      <div aria-label={interpolate(t.stage, { stage: t[stage] })} className="flex items-center gap-1.5" role="img">
        {STAGES.map((s, i) => {
          const Icon = STAGE_ICON[s];
          return (
            <div className="flex items-center gap-1.5" key={s}>
              <div
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border text-[10px]",
                  i === at
                    ? "border-primary bg-primary text-primary-foreground"
                    : i < at
                      ? "border-category-2/30 bg-category-2/10 text-category-2-foreground"
                      : "border-border bg-muted text-muted-foreground",
                )}
                title={t[s]}
              >
                <Icon className="size-3" />
              </div>
              {i < STAGES.length - 1 ? <div className={cn("h-px w-3", i < at ? "bg-category-2/40" : "bg-border")} /> : null}
            </div>
          );
        })}
      </div>
    );
  };

  const sortHead = (id: "placedAt" | "total", label: string, cellClass?: string) => {
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

  const bulkActions = (
    <>
      {onMarkShipped ? (
        <Button aria-busy={ship.isPending()} className="pointer-coarse:h-10" disabled={ship.isPending()} onClick={() => void ship.run(ids)} size="xs" variant="ghost">
          {ship.isPending() ? <Spinner data-icon="inline-start" /> : null}
          {t.markShipped}
        </Button>
      ) : null}
      {onPrintLabels ? (
        <Button aria-busy={labels.isPending()} className="pointer-coarse:h-10" disabled={labels.isPending()} onClick={() => void labels.run(ids)} size="xs" variant="ghost">
          {labels.isPending() ? <Spinner data-icon="inline-start" /> : null}
          {t.printLabels}
        </Button>
      ) : null}
    </>
  );

  const message = (title: string, description?: string, action?: ReactNode) => (
    <TableRow>
      <TableCell className="whitespace-normal py-12 text-center" colSpan={columns}>
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
        <TableCell className="ps-4" colSpan={columns}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-24 motion-reduce:animate-none" />
              <Skeleton className="h-3 w-16 motion-reduce:animate-none" />
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
    body = message(t.emptyTitle, t.emptyDescription);
  } else {
    body = items.map((o) => {
      const eta = interpolate(t.eta, { date: o.eta ? format.date(o.eta, { month: "short", day: "numeric", timeZone: "UTC" }) : t.noEta });
      const number = orderHref ? (
        <WirefrontLink className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring" href={orderHref(o)}>
          {o.number}
        </WirefrontLink>
      ) : (
        o.number
      );
      return (
        <TableRow data-state={selection.isSelected(o.id) ? "selected" : undefined} key={o.id}>
          {selectable ? (
            <TableCell className="ps-4">
              {/* The label widens the hit area to the whole cell on touch. */}
              <label className="-m-2.5 flex cursor-pointer p-2.5 pointer-coarse:-m-3.5 pointer-coarse:p-3.5" htmlFor={`order-${o.id}`}>
                <Checkbox
                  aria-label={interpolate(t.select, { number: o.number })}
                  checked={selection.isSelected(o.id)}
                  id={`order-${o.id}`}
                  onCheckedChange={() => selection.toggle(o.id)}
                />
              </label>
            </TableCell>
          ) : null}
          <TableCell className={selectable ? undefined : "ps-4"}>
            <div className="font-mono text-sm">{number}</div>
            <div className="font-medium text-sm sm:hidden">{o.customer}</div>
            <div className="text-muted-foreground text-xs tabular-nums">{eta}</div>
          </TableCell>
          <TableCell className="font-medium max-sm:hidden">{o.customer}</TableCell>
          <TableCell className="max-md:hidden">
            <Badge className="font-mono text-[10px]" variant="outline">
              {o.itemCount === 1 ? t.itemsOne : interpolate(t.itemsOther, { count: o.itemCount })}
            </Badge>
          </TableCell>
          <TableCell className="max-sm:hidden">
            <span className="lg:hidden">{stageBadge(o.stage)}</span>
            <span className="max-lg:hidden">{stageTrack(o.stage)}</span>
          </TableCell>
          <TableCell className="text-muted-foreground max-lg:hidden">{o.carrier ?? t.noCarrier}</TableCell>
          <TableCell className="pe-4 text-end font-mono tabular-nums">
            {format.money(o.total, o.currency)}
            <div className="mt-1 flex justify-end font-sans sm:hidden">{stageBadge(o.stage)}</div>
          </TableCell>
        </TableRow>
      );
    });
  }

  const failure = ship.error ?? labels.error;

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-12", count > 0 && "max-sm:pb-28", className)}>
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <h1 className="font-heading text-xl">{t.title}</h1>
            <p className="text-muted-foreground text-sm">
              {status === "ready" ? (total === 1 ? t.countOne : interpolate(t.countOther, { count: format.number(total) })) : null}
            </p>
          </div>
          {count > 0 ? (
            <div className="hidden items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 shadow-xs/5 sm:flex">
              <span className="text-sm">{interpolate(t.selected, { count })}</span>
              <span aria-hidden className="text-muted-foreground">
                ·
              </span>
              {bulkActions}
            </div>
          ) : null}
        </header>

        <div aria-live="polite">
          {failure ? (
            <p className="mb-3 text-destructive-foreground text-sm" role="alert">
              {failure}
            </p>
          ) : labelsUrl ? (
            <p className="mb-3 text-sm">
              {t.labelsReady}{" "}
              <a className="font-medium underline underline-offset-4" download href={labelsUrl}>
                {t.downloadLabels}
              </a>
            </p>
          ) : null}
        </div>

        {/*
          Priority columns: phones see select, Order (customer + ETA folded in)
          and Total (+ stage). Customer and a text status return at sm, Items at
          md, the stage tracker and Carrier at lg.
        */}
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table aria-busy={status === "loading"}>
            <TableHeader>
              <TableRow>
                {selectable ? (
                  <TableHead className="ps-4">
                    <Checkbox
                      aria-label={t.selectAll}
                      checked={selection.allSelected}
                      disabled={items.length === 0}
                      indeterminate={selection.someSelected}
                      onCheckedChange={selection.toggleAll}
                    />
                  </TableHead>
                ) : null}
                {sortHead("placedAt", t.columnOrder, selectable ? undefined : "ps-4")}
                <TableHead className="max-sm:hidden">{t.columnCustomer}</TableHead>
                <TableHead className="max-md:hidden">{t.columnItems}</TableHead>
                <TableHead className="max-sm:hidden">{t.columnStatus}</TableHead>
                <TableHead className="max-lg:hidden">{t.columnCarrier}</TableHead>
                {sortHead("total", t.columnTotal, "pe-4 text-end")}
              </TableRow>
            </TableHeader>
            <TableBody>{body}</TableBody>
          </Table>
        </div>

        {status === "ready" && pages > 1 ? (
          <nav aria-label={t.pagination} className="mt-3 flex items-center justify-end gap-2 text-muted-foreground text-sm">
            <span className="tabular-nums">{interpolate(t.range, { from, to, total })}</span>
            <Button aria-label={t.previous} disabled={query.page <= 1} onClick={() => onQueryChange(withPage(query, query.page - 1, total))} size="icon-sm" variant="outline">
              <ChevronLeftIcon />
            </Button>
            <Button aria-label={t.next} disabled={query.page >= pages} onClick={() => onQueryChange(withPage(query, query.page + 1, total))} size="icon-sm" variant="outline">
              <ChevronRightIcon />
            </Button>
          </nav>
        ) : null}
      </div>

      {/* Phones: bulk actions dock to the bottom while rows are selected. */}
      {count > 0 ? (
        <div
          aria-label={t.bulkActions}
          className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-2 border-t bg-background/95 px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg backdrop-blur sm:hidden"
          role="toolbar"
        >
          <span className="text-sm">{interpolate(t.selected, { count })}</span>
          <div className="flex items-center gap-1">{bulkActions}</div>
        </div>
      ) : null}
    </div>
  );
}

export function OrdersTable(props: OrdersTableProps) {
  return (
    <ScreenBoundary name="OrdersTable">
      <OrdersTableScreen {...props} />
    </ScreenBoundary>
  );
}
