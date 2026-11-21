// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import { Checkbox } from "@wirefront/ui/checkbox";
import { CheckboxGroup } from "@wirefront/ui/checkbox-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@wirefront/ui/collapsible";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@wirefront/ui/input-group";
import { Label } from "@wirefront/ui/label";
import { cn } from "@wirefront/ui/lib/utils";
import { RadioGroup, RadioGroupItem } from "@wirefront/ui/radio-group";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@wirefront/ui/sheet";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Slider } from "@wirefront/ui/slider";
import { Switch } from "@wirefront/ui/switch";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { pageCount, withFilter, withPage } from "@wirefront/ui/wirefront/list";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus, ListQuery } from "@wirefront/ui/wirefront/types";
import { ChevronDownIcon, CircleAlertIcon, RotateCcwIcon, SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import { type ReactNode, useEffect, useId, useState } from "react";

import type { ListedProduct, ProductCategory, ProductColor, ProductFacetCounts, ProductFilters } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("productFilterSidebar.<key>"). */
export const PRODUCT_FILTER_SIDEBAR_MESSAGES = {
  title: "Products",
  showing: "Showing {count} of {total} products.",
  filters: "Filters",
  reset: "Reset",
  searchFilters: "Search filters",
  searchFiltersPlaceholder: "Search filters…",
  category: "Category",
  price: "Price",
  priceRange: "Price range",
  priceValue: "{min} – {max}",
  color: "Color",
  rating: "Rating",
  anyRating: "Any rating",
  ratingExactly: "{rating}",
  ratingAndUp: "{rating} & up",
  ratingLabel: "Rated {rating} out of 5",
  more: "More options",
  inStock: "In stock only",
  onSale: "On sale",
  freeShipping: "Free shipping",
  isNew: "New arrivals",
  showResultsOne: "Show 1 result",
  showResults: "Show {count} results",
  sale: "Sale",
  new: "New",
  outOfStock: "Out of stock",
  noMatch: "No products match these filters.",
  resetFilters: "Reset filters",
  errorTitle: "Couldn’t load products.",
  retry: "Try again",
  previous: "Previous",
  next: "Next",
  pageOf: "Page {page} of {pages}",
};

export type ProductsListQuery = ListQuery<ProductFilters>;

export interface ProductFilterSidebarProps {
  /** The current page of products. */
  products: ListedProduct[];
  /** Products matching the filters across all pages. */
  total: number;
  /** All products, ignoring the filters. Defaults to `total`. */
  overall?: number;
  /** Counts beside categories and ratings. Hidden without it. */
  counts?: ProductFacetCounts;
  categories: ProductCategory[];
  colors: ProductColor[];
  query: ProductsListQuery;
  /** Called when the user changes a filter or pages. Fetch the new page and pass it back in. */
  onQueryChange: (query: ProductsListQuery) => void;
  /** The price slider's bounds and step. */
  priceBounds?: [number, number];
  priceStep?: number;
  /** "loading" shows skeleton cards; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Link each product. Without it cards are not links. */
  productHref?: (product: ListedProduct) => string;
  className?: string;
}

const RATINGS = [5, 4, 3];
const TOGGLES = ["inStock", "onSale", "freeShipping", "isNew"] as const;
const SKELETON_CARDS = ["s1", "s2", "s3", "s4", "s5", "s6"];
const tag = "h-4.5 rounded-sm px-1 font-mono text-[10px]";

function Section({ title, badge, children }: { title: string; badge?: number; children: ReactNode }) {
  return (
    <Collapsible className="border-b py-3 last:border-b-0" defaultOpen>
      <CollapsibleTrigger className="group flex min-h-8 w-full items-center justify-between gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex items-center gap-2 font-medium text-sm">
          {title}
          {badge ? (
            <Badge className={tag} variant="secondary">
              {badge}
            </Badge>
          ) : null}
        </span>
        <ChevronDownIcon aria-hidden className="size-4 text-muted-foreground transition-transform group-data-panel-open:-rotate-180 motion-reduce:transition-none" />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden">
        <div className="pt-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ProductFilterSidebarScreen({
  products,
  total,
  overall = total,
  counts,
  categories,
  colors,
  query,
  onQueryChange,
  priceBounds = [0, 200],
  priceStep = 2,
  status = "ready",
  error,
  onRetry,
  productHref,
  className,
}: ProductFilterSidebarProps) {
  const t = useMessages("productFilterSidebar", PRODUCT_FILTER_SIDEBAR_MESSAGES);
  const format = useFormat();
  const id = useId();
  const [search, setSearch] = useState("");
  const filters = query.filters ?? {};
  const [lo, hi] = priceBounds;
  const committedPrice: [number, number] = [filters.priceMin ?? lo, filters.priceMax ?? hi];
  // The slider shows its value while dragging and reports it once, on release.
  const [price, setPrice] = useState(committedPrice);
  useEffect(() => setPrice([filters.priceMin ?? lo, filters.priceMax ?? hi]), [filters.priceMin, filters.priceMax, lo, hi]);
  const money = (value: number) => format.money(value, undefined, { maximumFractionDigits: 0 });
  const colorById = new Map(colors.map((c) => [c.id, c]));
  const pages = pageCount(query, total);

  const activeCount =
    (filters.category?.length ?? 0) +
    (filters.color?.length ?? 0) +
    (filters.ratingMin ? 1 : 0) +
    (filters.priceMin !== undefined || filters.priceMax !== undefined ? 1 : 0) +
    TOGGLES.filter((key) => filters[key]).length;
  const set = (key: keyof ProductFilters, value: unknown) => onQueryChange(withFilter(query, key, value));
  const reset = () => onQueryChange({ ...query, filters: undefined, page: 1 });
  const matches = (label: string) => !search.trim() || label.toLowerCase().includes(search.trim().toLowerCase());
  const commitPrice = ([min, max]: number[]) => {
    let next = withFilter(query, "priceMin", min === undefined || min <= lo ? undefined : min);
    next = withFilter(next, "priceMax", max === undefined || max >= hi ? undefined : max);
    onQueryChange(next);
  };
  const showResults = total === 1 ? t.showResultsOne : interpolate(t.showResults, { count: total });

  const panel = (inSheet: boolean) => (
    <div className={inSheet ? "flex h-full min-h-0 flex-col" : "flex h-full flex-col rounded-xl border bg-card shadow-xs/5"}>
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontalIcon aria-hidden className="size-4 text-muted-foreground" />
          <h2 className="font-medium text-sm">{t.filters}</h2>
          {activeCount > 0 ? (
            <Badge className={tag} variant="secondary">
              {activeCount}
            </Badge>
          ) : null}
        </div>
        <Button className="text-muted-foreground" disabled={activeCount === 0} onClick={reset} size="xs" variant="ghost">
          <RotateCcwIcon />
          {t.reset}
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon aria-hidden className="size-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput aria-label={t.searchFilters} className="h-8 text-sm" onChange={(e) => setSearch(e.target.value)} placeholder={t.searchFiltersPlaceholder} value={search} />
          </InputGroup>
        </div>

        {matches(t.category) ? (
          <Section badge={filters.category?.length || undefined} title={t.category}>
            <CheckboxGroup aria-label={t.category} className="flex flex-col gap-2" onValueChange={(v) => set("category", v)} value={filters.category ?? []}>
              {categories.map((c) => (
                <Label className="flex min-h-6 cursor-pointer items-center gap-2 font-normal text-sm pointer-coarse:min-h-10" key={c.id}>
                  <Checkbox value={c.id} />
                  <span className="flex-1">{c.label}</span>
                  {counts ? <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{counts.category[c.id] ?? 0}</span> : null}
                </Label>
              ))}
            </CheckboxGroup>
          </Section>
        ) : null}

        {matches(t.price) ? (
          <Section badge={filters.priceMin !== undefined || filters.priceMax !== undefined ? 1 : undefined} title={t.price}>
            <div className="px-1 pt-1">
              <span className="sr-only" id={`${id}-price`}>
                {t.priceRange}
              </span>
              <Slider
                aria-labelledby={`${id}-price`}
                max={hi}
                min={lo}
                onValueChange={(v) => Array.isArray(v) && setPrice([v[0] ?? lo, v[1] ?? hi])}
                onValueCommitted={(v) => Array.isArray(v) && commitPrice(v)}
                step={priceStep}
                value={price}
              />
              <div className="mt-3 flex items-center justify-between text-muted-foreground text-xs tabular-nums">
                <span className="font-mono text-foreground">{interpolate(t.priceValue, { min: money(price[0]), max: money(price[1]) })}</span>
                <span>{interpolate(t.priceValue, { min: money(lo), max: money(hi) })}</span>
              </div>
            </div>
          </Section>
        ) : null}

        {matches(t.color) ? (
          <Section badge={filters.color?.length || undefined} title={t.color}>
            <CheckboxGroup aria-label={t.color} className="grid grid-cols-2 gap-1.5" onValueChange={(v) => set("color", v)} value={filters.color ?? []}>
              {colors.map((c) => (
                <Label
                  className="flex min-h-8 cursor-pointer items-center gap-1.5 rounded-md border p-1.5 font-normal text-xs hover:bg-accent has-checked:border-foreground/30 has-checked:bg-foreground/5"
                  key={c.id}
                >
                  <Checkbox value={c.id} />
                  <span aria-hidden className="size-3 shrink-0 rounded-full ring-1 ring-border" style={{ background: c.swatch }} />
                  <span className="truncate">{c.label}</span>
                </Label>
              ))}
            </CheckboxGroup>
          </Section>
        ) : null}

        {matches(t.rating) ? (
          <Section badge={filters.ratingMin ? 1 : undefined} title={t.rating}>
            <RadioGroup
              aria-label={t.rating}
              className="flex flex-col gap-2"
              onValueChange={(v) => set("ratingMin", v === "any" ? undefined : Number(v))}
              value={filters.ratingMin ? String(filters.ratingMin) : "any"}
            >
              {["any", ...RATINGS.map(String)].map((value) => (
                <Label className="flex min-h-6 cursor-pointer items-center gap-2 font-normal text-sm pointer-coarse:min-h-10" key={value}>
                  <RadioGroupItem value={value} />
                  <span className="flex-1">
                    {value === "any" ? (
                      t.anyRating
                    ) : (
                      <>
                        <span aria-hidden className="font-mono text-category-3-foreground">
                          ★
                        </span>{" "}
                        {interpolate(Number(value) === 5 ? t.ratingExactly : t.ratingAndUp, { rating: value })}
                      </>
                    )}
                  </span>
                  {counts && value !== "any" ? <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{counts.ratingMin[value] ?? 0}</span> : null}
                </Label>
              ))}
            </RadioGroup>
          </Section>
        ) : null}

        {matches(t.more) ? (
          <Section title={t.more}>
            {TOGGLES.map((key) => (
              <div className="flex items-center justify-between py-1.5 pointer-coarse:min-h-11" key={key}>
                <Label className="flex-1 cursor-pointer font-normal text-sm" htmlFor={`${id}-${key}-${inSheet}`}>
                  {t[key]}
                </Label>
                <Switch checked={filters[key] === true} id={`${id}-${key}-${inSheet}`} onCheckedChange={(on) => set(key, on || undefined)} />
              </div>
            ))}
          </Section>
        ) : null}
      </div>

      {inSheet ? (
        <footer className="flex items-center gap-2 border-t bg-background p-3">
          <Button className="flex-1" disabled={activeCount === 0} onClick={reset} size="sm" variant="ghost">
            {t.reset}
          </Button>
          <SheetClose render={<Button className="flex-1" size="sm" />}>{showResults}</SheetClose>
        </footer>
      ) : null}
    </div>
  );

  let grid: ReactNode;
  if (status === "loading") {
    grid = (
      <div aria-busy className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
        {SKELETON_CARDS.map((key) => (
          <div className="rounded-xl border bg-card p-2 sm:p-3" key={key}>
            <Skeleton className="aspect-4/3 w-full rounded-lg motion-reduce:animate-none sm:aspect-auto sm:h-28" />
            <Skeleton className="mt-2 h-3.5 w-24 motion-reduce:animate-none" />
          </div>
        ))}
      </div>
    );
  } else if (status === "error") {
    grid = (
      <div className="flex flex-col items-center gap-1 rounded-xl border bg-card px-6 py-12 text-center" role="alert">
        <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive-foreground">
          <CircleAlertIcon aria-hidden className="size-4.5" />
        </span>
        <p className="font-medium text-sm">{t.errorTitle}</p>
        {error ? <p className="text-pretty text-muted-foreground text-xs">{error}</p> : null}
        {onRetry ? (
          <Button className="mt-3" onClick={onRetry} size="sm" variant="outline">
            {t.retry}
          </Button>
        ) : null}
      </div>
    );
  } else if (products.length === 0) {
    grid = (
      <div className="rounded-xl border border-dashed bg-card/40 p-12 text-center">
        <p className="text-muted-foreground text-sm">{t.noMatch}</p>
        {activeCount > 0 ? (
          <Button className="mt-3" onClick={reset} size="sm" variant="outline">
            {t.resetFilters}
          </Button>
        ) : null}
      </div>
    );
  } else {
    grid = (
      <ul className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
        {products.map((p) => {
          const swatches = p.colors.map((c) => colorById.get(c)).filter((c): c is ProductColor => c !== undefined);
          const first = swatches[0]?.swatch ?? "var(--muted)";
          return (
            <li className="relative min-w-0 rounded-xl border bg-card p-2 shadow-xs/5 sm:p-3" key={p.id}>
              <div
                className="relative aspect-4/3 overflow-hidden rounded-lg bg-muted sm:aspect-auto sm:h-28"
                style={p.imageUrl ? undefined : { background: `linear-gradient(135deg, ${first} 0%, ${swatches[1]?.swatch ?? first} 100%)` }}
              >
                {p.imageUrl ? <img alt="" className="size-full object-cover" src={p.imageUrl} /> : null}
                {p.onSale ? (
                  <Badge className="absolute inset-s-2 top-2 font-mono text-[10px] uppercase" variant="secondary">
                    {t.sale}
                  </Badge>
                ) : null}
                {p.isNew ? (
                  <Badge className="absolute inset-e-2 top-2 border-foreground/20 bg-background/80 font-mono text-[10px] uppercase backdrop-blur" variant="outline">
                    {t.new}
                  </Badge>
                ) : null}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                {productHref ? (
                  <WirefrontLink
                    className="min-w-0 truncate rounded-sm font-medium text-sm outline-none after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                    href={productHref(p)}
                  >
                    {p.name}
                  </WirefrontLink>
                ) : (
                  <span className="min-w-0 truncate font-medium text-sm">{p.name}</span>
                )}
                <span className="shrink-0 font-mono text-foreground text-sm tabular-nums">{money(p.price)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-muted-foreground text-xs">
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden className="font-mono text-category-3-foreground">
                    ★
                  </span>
                  <span aria-hidden>{format.number(p.rating, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                  <span className="sr-only">{interpolate(t.ratingLabel, { rating: format.number(p.rating, { maximumFractionDigits: 1 }) })}</span>
                </span>
                <span className="flex items-center gap-1">
                  {swatches.map((c) => (
                    <span aria-label={c.label} className="size-2.5 rounded-full ring-1 ring-border" key={c.id} role="img" style={{ background: c.swatch }} title={c.label} />
                  ))}
                </span>
              </div>
              {!p.inStock ? <p className="mt-1 font-mono text-[10px] text-destructive-foreground uppercase tracking-wider">{t.outOfStock}</p> : null}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]", className)}>
      <aside className="sticky top-12 hidden h-[calc(100svh-6rem)] lg:block">{panel(false)}</aside>
      <section>
        <header className="mb-6 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-xl">{t.title}</h1>
            <p aria-live="polite" className="text-muted-foreground text-sm">
              {status === "ready" ? interpolate(t.showing, { count: total, total: overall }) : null}
            </p>
          </div>
          <Sheet>
            <SheetTrigger render={<Button className="shrink-0 lg:hidden" size="sm" variant="outline" />}>
              <SlidersHorizontalIcon />
              {t.filters}
              {activeCount > 0 ? (
                <Badge className={tag} variant="secondary">
                  {activeCount}
                </Badge>
              ) : null}
            </SheetTrigger>
            <SheetContent className="max-w-85 bg-card pb-[env(safe-area-inset-bottom)]" showCloseButton={false} side="left">
              <SheetTitle className="sr-only">{t.filters}</SheetTitle>
              {panel(true)}
            </SheetContent>
          </Sheet>
        </header>

        {grid}

        {status === "ready" && pages > 1 ? (
          <nav className="mt-4 flex items-center justify-between gap-2 text-muted-foreground text-xs">
            <Button disabled={query.page <= 1} onClick={() => onQueryChange(withPage(query, query.page - 1, total))} size="sm" variant="outline">
              {t.previous}
            </Button>
            <span>{interpolate(t.pageOf, { page: query.page, pages })}</span>
            <Button disabled={query.page >= pages} onClick={() => onQueryChange(withPage(query, query.page + 1, total))} size="sm" variant="outline">
              {t.next}
            </Button>
          </nav>
        ) : null}
      </section>
    </div>
  );
}

export function ProductFilterSidebar(props: ProductFilterSidebarProps) {
  return (
    <ScreenBoundary name="ProductFilterSidebar">
      <ProductFilterSidebarScreen {...props} />
    </ScreenBoundary>
  );
}
