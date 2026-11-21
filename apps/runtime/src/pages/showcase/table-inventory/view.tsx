// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Badge } from "@wirefront/ui/badge";
import { Button, buttonVariants } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@wirefront/ui/table";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { pageCount, toggleSort, withPage } from "@wirefront/ui/wirefront/list";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus, ListQuery } from "@wirefront/ui/wirefront/types";
import { ArrowDownIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, ShoppingBagIcon } from "lucide-react";
import type { ReactNode } from "react";

import type { InventoryItem, InventoryPage } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("inventoryTable.<key>"). */
export const INVENTORY_TABLE_MESSAGES = {
  title: "Inventory",
  countOne: "1 product",
  countOther: "{count} products",
  newProduct: "Product",
  columnProduct: "Product",
  columnSku: "SKU",
  columnCategory: "Category",
  columnStock: "Stock",
  columnPrice: "Price",
  stockOf: "{name} stock",
  inStock: "In stock",
  lowStock: "Low stock",
  outOfStock: "Out of stock",
  emptyTitle: "No products yet",
  emptyDescription: "Products you add will show up here with their stock.",
  errorTitle: "Couldn’t load inventory",
  retry: "Try again",
  pagination: "Pagination",
  previous: "Previous page",
  next: "Next page",
  range: "{from}–{to} of {total}",
};

export type InventoryListQuery = ListQuery;

export interface InventoryTableProps {
  /** The current page and its total. Leave out while loading. */
  page?: InventoryPage;
  /** Sort and page; send it to your API (see `InventoryQuery` in schema.ts). */
  query: InventoryListQuery;
  onQueryChange: (query: InventoryListQuery) => void;
  /** "loading" shows skeleton rows; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Stock below this counts as low. */
  lowStockAt?: number;
  /** A line under the title, e.g. the store's name. */
  subtitle?: string;
  /** Where "Product" goes. Hidden when not given. */
  newProductHref?: string;
  /** Where a product's name links to. Plain text when not given. */
  productHref?: (item: InventoryItem) => string;
  className?: string;
}

const TONE = {
  out: { badge: "border-destructive/30 text-destructive-foreground", bar: "bg-destructive" },
  low: { badge: "border-category-3/30 text-category-3-foreground", bar: "bg-category-3" },
  ok: { badge: "border-category-2/30 text-category-2-foreground", bar: "bg-category-2" },
};
const SKELETON_ROWS = ["s1", "s2", "s3", "s4", "s5"];

function InventoryTableScreen({ page, query, onQueryChange, status = "ready", error, onRetry, lowStockAt = 10, subtitle, newProductHref, productHref, className }: InventoryTableProps) {
  const t = useMessages("inventoryTable", INVENTORY_TABLE_MESSAGES);
  const format = useFormat();
  const items = page?.items ?? [];
  const total = page?.total ?? 0;
  const pages = pageCount(query, total);
  const from = total === 0 ? 0 : (query.page - 1) * query.pageSize + 1;
  const to = Math.min(query.page * query.pageSize, total);

  const level = (item: InventoryItem) => (item.stock === 0 ? "out" : item.stock < lowStockAt ? "low" : "ok");
  const levelLabel = { out: t.outOfStock, low: t.lowStock, ok: t.inStock };

  const meter = (item: InventoryItem) => {
    const tone = TONE[level(item)];
    const pct = Math.min(100, Math.round((item.stock / item.capacity) * 100));
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {/* A native meter for assistive tech; the bar is its picture. */}
        <meter aria-label={interpolate(t.stockOf, { name: item.name })} className="sr-only" max={item.capacity} min={0} value={item.stock} />
        <div aria-hidden className="h-1.5 w-20 overflow-hidden rounded-full bg-muted lg:w-32">
          <div className={cn("h-full", tone.bar)} style={{ width: `${pct}%` }} />
        </div>
        <span className="font-mono text-xs tabular-nums">
          {format.number(item.stock)}
          <span className="text-muted-foreground">/{format.number(item.capacity)}</span>
        </span>
        <Badge className={cn("h-4.5 rounded-sm px-1 text-[0.625rem]", tone.badge)} variant="outline">
          {levelLabel[level(item)]}
        </Badge>
      </div>
    );
  };

  const sortHead = (id: "name" | "stock" | "price", label: string, cellClass?: string) => {
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
      <TableCell className="whitespace-normal py-12 text-center" colSpan={5}>
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
        <TableCell className="ps-4" colSpan={5}>
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-md motion-reduce:animate-none" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-40 motion-reduce:animate-none" />
              <Skeleton className="h-3 w-24 motion-reduce:animate-none" />
            </div>
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
    body = items.map((item) => (
      <TableRow key={item.id}>
        <TableCell className="w-full max-w-0 ps-4 sm:w-auto sm:max-w-none">
          <div className="flex items-center gap-3">
            {item.imageUrl ? (
              <img alt="" className="size-10 shrink-0 rounded-md object-cover ring-1 ring-border/60" src={item.imageUrl} />
            ) : (
              <div aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted font-medium text-muted-foreground ring-1 ring-border/60">
                {item.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate font-medium">
                {productHref ? (
                  <WirefrontLink className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring" href={productHref(item)}>
                    {item.name}
                  </WirefrontLink>
                ) : (
                  item.name
                )}
              </div>
              {item.variant ? <div className="truncate text-muted-foreground text-xs">{item.variant}</div> : null}
              <div className="mt-1.5 sm:hidden">{meter(item)}</div>
            </div>
          </div>
        </TableCell>
        <TableCell className="font-mono text-muted-foreground text-xs max-md:hidden">{item.sku}</TableCell>
        <TableCell className="text-muted-foreground max-lg:hidden">{item.category}</TableCell>
        <TableCell className="max-sm:hidden">{meter(item)}</TableCell>
        <TableCell className="pe-4 text-end font-mono tabular-nums">{format.money(item.price, item.currency)}</TableCell>
      </TableRow>
    ));
  }

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-12", className)}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <h1 className="flex items-center gap-2 font-heading text-xl">
              <ShoppingBagIcon aria-hidden className="size-5 text-muted-foreground" />
              {t.title}
            </h1>
            <p className="text-muted-foreground text-sm">
              {status === "ready" ? (total === 1 ? t.countOne : interpolate(t.countOther, { count: format.number(total) })) : null}
              {subtitle ? <> · {subtitle}</> : null}
            </p>
          </div>
          {newProductHref ? (
            <WirefrontLink className={cn(buttonVariants({ size: "sm" }), "pointer-coarse:h-10")} href={newProductHref}>
              <PlusIcon />
              {t.newProduct}
            </WirefrontLink>
          ) : null}
        </header>

        {/*
          Priority columns: phones see Product (stock folded in) + Price; Stock
          returns at sm, SKU at md, Category at lg.
        */}
        <div className="rounded-xl border bg-card shadow-xs/5">
          <Table aria-busy={status === "loading"}>
            <TableHeader>
              <TableRow>
                {sortHead("name", t.columnProduct, "ps-4")}
                <TableHead className="max-md:hidden">{t.columnSku}</TableHead>
                <TableHead className="max-lg:hidden">{t.columnCategory}</TableHead>
                {sortHead("stock", t.columnStock, "max-sm:hidden")}
                {sortHead("price", t.columnPrice, "pe-4 text-end")}
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
    </div>
  );
}

export function InventoryTable(props: InventoryTableProps) {
  return (
    <ScreenBoundary name="InventoryTable">
      <InventoryTableScreen {...props} />
    </ScreenBoundary>
  );
}
