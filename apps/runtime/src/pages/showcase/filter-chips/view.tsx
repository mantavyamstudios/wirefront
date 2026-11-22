// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import { Checkbox } from "@wirefront/ui/checkbox";
import { CheckboxGroup } from "@wirefront/ui/checkbox-group";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@wirefront/ui/input-group";
import { Label } from "@wirefront/ui/label";
import { cn } from "@wirefront/ui/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@wirefront/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wirefront/ui/select";
import { Separator } from "@wirefront/ui/separator";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Slider } from "@wirefront/ui/slider";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  pageCount,
  withFilter,
  withPage,
  withSearch,
} from "@wirefront/ui/wirefront/list";
import {
  interpolate,
  useFormat,
  useMessages,
  useWirefront,
  WirefrontLink,
} from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus, ListQuery } from "@wirefront/ui/wirefront/types";
import {
  ChevronDownIcon,
  CircleAlertIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { type ReactNode, useId, useMemo, useState } from "react";

import type {
  Customer,
  CustomerFilters,
  CustomerPlan,
  CustomerStatus,
} from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("customerFilterChips.<key>"). */
export const CUSTOMER_FILTER_CHIPS_MESSAGES = {
  search: "Search customers",
  searchPlaceholder: "Search customers…",
  filters: "Filters",
  addFilter: "Add filter",
  allAdded: "All filters added.",
  clearAll: "Clear all",
  status: "Status",
  plan: "Plan",
  country: "Country",
  mrr: "MRR",
  lastActive: "Last seen",
  tag: "Tag",
  isAnyOf: "is any of",
  is: "is",
  isNot: "is not",
  atLeast: "at least",
  within: "within",
  contains: "contains",
  noValue: "—",
  editChip: "Edit {field}:",
  removeChip: "Remove {field} filter",
  active: "Active",
  trial: "Trial",
  paused: "Paused",
  churned: "Churned",
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
  minMrr: "Minimum MRR",
  withinDays: "Seen within",
  days: "{count} days",
  daysShort: "{count}d",
  tagPlaceholder: "contains…",
  matchOne: "1 customer",
  match: "{count} customers",
  applied: "match · {count} filters applied",
  appliedOne: "match · 1 filter applied",
  saveView: "Save as view",
  share: "Share",
  noMatch: "No customers match these filters.",
  errorTitle: "Couldn’t load customers.",
  retry: "Try again",
  previous: "Previous",
  next: "Next",
  pageOf: "Page {page} of {pages}",
};

export type CustomersListQuery = ListQuery<CustomerFilters>;
type ChipKey =
  | "status"
  | "plan"
  | "country"
  | "mrrMin"
  | "activeWithinDays"
  | "tag";

export interface CustomerFilterChipsProps {
  /** The current page of customers. */
  customers: Customer[];
  /** Customers matching the query across all pages. */
  total: number;
  query: CustomersListQuery;
  /** Called when the user searches, edits a chip or pages. Fetch the new page and pass it back in. */
  onQueryChange: (query: CustomersListQuery) => void;
  /** Countries the Country chip offers, as ISO 3166-1 alpha-2 codes. */
  countries: string[];
  /** The MRR slider's top end and step. */
  mrrMax?: number;
  mrrStep?: number;
  /** The "Last seen" slider's top end, in days. */
  maxDays?: number;
  /** "loading" shows skeleton rows; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Save the current query as a view. The button hides without it. */
  onSaveView?: (query: CustomersListQuery) => void;
  /** Share the current query (e.g. copy a link). The button hides without it. */
  onShare?: (query: CustomersListQuery) => void;
  /** Link each customer. Without it names are plain text. */
  customerHref?: (customer: Customer) => string;
  className?: string;
}

const CHIPS: ChipKey[] = [
  "status",
  "plan",
  "country",
  "mrrMin",
  "activeWithinDays",
  "tag",
];
const STATUSES: CustomerStatus[] = ["active", "trial", "paused", "churned"];
const PLANS: CustomerPlan[] = ["free", "pro", "enterprise"];
const STATUS_TONE: Record<CustomerStatus, string> = {
  active: "bg-category-2",
  trial: "bg-category-1",
  paused: "bg-category-3",
  churned: "bg-muted-foreground/40",
};
const SKELETON_ROWS = ["s1", "s2", "s3", "s4", "s5"];

/** Whether a chip's filter is set in the query. */
const isSet = (filters: CustomerFilters, key: ChipKey) =>
  filters[key] !== undefined;

function Chip({
  field,
  op,
  values,
  tone,
  open,
  onOpenChange,
  onRemove,
  children,
}: {
  field: string;
  op: string;
  values: string[];
  tone: "default" | "include" | "exclude";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  const t = useMessages("customerFilterChips", CUSTOMER_FILTER_CHIPS_MESSAGES);
  const shown = values.length ? values : [t.noValue];
  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center divide-x divide-border overflow-hidden rounded-md border text-foreground text-xs",
        tone === "include"
          ? "border-category-2/30 bg-category-2/5"
          : tone === "exclude"
            ? "border-destructive/30 bg-destructive/5"
            : "border-border bg-background"
      )}
    >
      <span className="flex items-center gap-1.5 px-2 py-1 font-medium">
        {field}
      </span>
      <span
        className={cn(
          "px-2 py-1 font-mono text-[11px]",
          tone === "include"
            ? "text-category-2-foreground"
            : tone === "exclude"
              ? "text-destructive-foreground"
              : "text-muted-foreground"
        )}
      >
        {op}
      </span>
      <Popover onOpenChange={onOpenChange} open={open}>
        <PopoverTrigger
          render={
            // Named by its visible text plus screen-reader-only context, so the
            // spoken name contains what's on screen (WCAG 2.5.3).
            <button
              className="flex min-h-7 min-w-0 cursor-pointer items-center gap-1 px-2 py-1 hover:bg-accent/60 pointer-coarse:min-h-10"
              type="button"
            >
              <span className="sr-only">
                {interpolate(t.editChip, { field })}
              </span>{" "}
              <span className="font-medium">
                {shown[0]}
                {shown.length > 1 ? (
                  <>
                    <span aria-hidden className="text-muted-foreground">
                      {" "}
                      +{shown.length - 1}
                    </span>
                    <span className="sr-only">
                      , {shown.slice(1).join(", ")}
                    </span>
                  </>
                ) : null}
              </span>
              <ChevronDownIcon aria-hidden className="size-3 opacity-60" />
            </button>
          }
        />
        <PopoverContent className="w-[min(14rem,calc(100vw-2rem))] p-2">
          {children}
        </PopoverContent>
      </Popover>
      <button
        aria-label={interpolate(t.removeChip, { field })}
        className="flex min-h-7 min-w-7 items-center justify-center px-1.5 py-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive pointer-coarse:min-h-10 pointer-coarse:min-w-10"
        onClick={onRemove}
        type="button"
      >
        <XIcon aria-hidden className="size-3" />
      </button>
    </div>
  );
}

/** A slider that shows its value while dragging and reports it once, on release. */
function CommitSlider({
  label,
  value,
  display,
  min,
  max,
  step,
  onCommit,
}: {
  label: string;
  value: number;
  display: (v: number) => string;
  min: number;
  max: number;
  step: number;
  onCommit: (v: number) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground" id={id}>
          {label}
        </span>
        <span className="font-mono text-foreground tabular-nums">
          {display(draft)}
        </span>
      </div>
      <Slider
        aria-labelledby={id}
        max={max}
        min={min}
        onValueChange={(v) => setDraft(Array.isArray(v) ? (v[0] ?? min) : v)}
        onValueCommitted={(v) => onCommit(Array.isArray(v) ? (v[0] ?? min) : v)}
        step={step}
        value={[draft]}
      />
    </div>
  );
}

function CustomerFilterChipsScreen({
  customers,
  total,
  query,
  onQueryChange,
  countries,
  mrrMax = 20_000,
  mrrStep = 100,
  maxDays = 120,
  status = "ready",
  error,
  onRetry,
  onSaveView,
  onShare,
  customerHref,
  className,
}: CustomerFilterChipsProps) {
  const t = useMessages("customerFilterChips", CUSTOMER_FILTER_CHIPS_MESSAGES);
  const format = useFormat();
  const { locale } = useWirefront();
  const regionName = useMemo(() => {
    const names = new Intl.DisplayNames(locale, { type: "region" });
    return (code: string) => names.of(code) ?? code;
  }, [locale]);
  const filters = query.filters ?? {};
  // Chips the user added but hasn't given a value yet; they filter nothing.
  const [drafts, setDrafts] = useState<ChipKey[]>([]);
  const [editing, setEditing] = useState<ChipKey>();
  const shownChips = CHIPS.filter(
    (key) => isSet(filters, key) || drafts.includes(key)
  );
  const available = CHIPS.filter((key) => !shownChips.includes(key));
  const appliedCount = CHIPS.filter((key) => isSet(filters, key)).length;
  const pages = pageCount(query, total);
  const money = (value: number) =>
    format.money(value, undefined, { maximumFractionDigits: 0 });
  const days = (count: number) => interpolate(t.daysShort, { count });

  const set = (key: keyof CustomerFilters, value: unknown) => {
    setDrafts((d) => d.filter((k) => k !== key));
    onQueryChange(withFilter(query, key, value));
  };
  const remove = (key: ChipKey) => {
    setDrafts((d) => d.filter((k) => k !== key));
    setEditing(undefined);
    let next = withFilter(query, key, undefined);
    if (key === "country") next = withFilter(next, "excludeCountry", undefined);
    onQueryChange(next);
  };
  const clearAll = () => {
    setDrafts([]);
    onQueryChange({ ...query, search: undefined, filters: undefined, page: 1 });
  };
  const chipProps = (key: ChipKey) => ({
    open: editing === key,
    onOpenChange: (open: boolean) => setEditing(open ? key : undefined),
    onRemove: () => remove(key),
  });
  const label: Record<ChipKey, string> = {
    status: t.status,
    plan: t.plan,
    country: t.country,
    mrrMin: t.mrr,
    activeWithinDays: t.lastActive,
    tag: t.tag,
  };

  const checkRow =
    "flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 font-normal text-sm hover:bg-accent pointer-coarse:min-h-10";

  const chip = (key: ChipKey) => {
    switch (key) {
      case "status":
        return (
          <Chip
            {...chipProps(key)}
            field={t.status}
            key={key}
            op={t.isAnyOf}
            tone="include"
            values={(filters.status ?? []).map((s) => t[s])}
          >
            <CheckboxGroup
              aria-label={t.status}
              className="flex flex-col gap-1"
              onValueChange={(v) => set("status", v)}
              value={filters.status ?? []}
            >
              {STATUSES.map((s) => (
                <Label className={checkRow} key={s}>
                  <Checkbox value={s} />
                  {t[s]}
                </Label>
              ))}
            </CheckboxGroup>
          </Chip>
        );
      case "plan": {
        const plans = PLANS.map((p) => ({ value: p, label: t[p] }));
        return (
          <Chip
            {...chipProps(key)}
            field={t.plan}
            key={key}
            op={t.is}
            tone="include"
            values={filters.plan ? [t[filters.plan]] : []}
          >
            <Select
              items={plans}
              onValueChange={(v) => v && set("plan", v)}
              value={filters.plan ?? null}
            >
              <SelectTrigger aria-label={t.plan} className="w-full" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {plans.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Chip>
        );
      }
      case "country": {
        const exclude = filters.excludeCountry === true;
        return (
          <Chip
            {...chipProps(key)}
            field={t.country}
            key={key}
            op={exclude ? t.isNot : t.is}
            tone={exclude ? "exclude" : "include"}
            values={filters.country ?? []}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1 rounded-md border p-0.5">
                {[false, true].map((ex) => (
                  <button
                    aria-pressed={exclude === ex}
                    className={cn(
                      "min-h-7 flex-1 rounded-sm px-2 py-1 font-mono text-[11px]",
                      exclude === ex
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-accent"
                    )}
                    key={String(ex)}
                    onClick={() =>
                      filters.country &&
                      onQueryChange(
                        withFilter(query, "excludeCountry", ex || undefined)
                      )
                    }
                    type="button"
                  >
                    {ex ? t.isNot : t.is}
                  </button>
                ))}
              </div>
              <CheckboxGroup
                aria-label={t.country}
                className="flex flex-col gap-1"
                onValueChange={(v) => set("country", v)}
                value={filters.country ?? []}
              >
                {countries.map((code) => (
                  <Label className={checkRow} key={code}>
                    <Checkbox value={code} />
                    <span className="flex-1 truncate">{regionName(code)}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {code}
                    </span>
                  </Label>
                ))}
              </CheckboxGroup>
            </div>
          </Chip>
        );
      }
      case "mrrMin":
        return (
          <Chip
            {...chipProps(key)}
            field={t.mrr}
            key={key}
            op={t.atLeast}
            tone="default"
            values={filters.mrrMin !== undefined ? [money(filters.mrrMin)] : []}
          >
            <CommitSlider
              display={money}
              label={t.minMrr}
              max={mrrMax}
              min={0}
              onCommit={(v) => set("mrrMin", v)}
              step={mrrStep}
              value={filters.mrrMin ?? 0}
            />
          </Chip>
        );
      case "activeWithinDays":
        return (
          <Chip
            {...chipProps(key)}
            field={t.lastActive}
            key={key}
            op={t.within}
            tone="default"
            values={
              filters.activeWithinDays ? [days(filters.activeWithinDays)] : []
            }
          >
            <CommitSlider
              display={(count) => interpolate(t.days, { count })}
              label={t.withinDays}
              max={maxDays}
              min={1}
              onCommit={(v) => set("activeWithinDays", v)}
              step={1}
              value={filters.activeWithinDays ?? 30}
            />
          </Chip>
        );
      case "tag":
        return (
          <Chip
            {...chipProps(key)}
            field={t.tag}
            key={key}
            op={t.contains}
            tone="default"
            values={filters.tag ? [filters.tag] : []}
          >
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon
                  aria-hidden
                  className="size-3.5 text-muted-foreground"
                />
              </InputGroupAddon>
              <InputGroupInput
                aria-label={t.tag}
                className="h-8 text-sm"
                defaultValue={filters.tag ?? ""}
                onKeyDown={(e) => e.key === "Enter" && setEditing(undefined)}
                onChange={(e) =>
                  set("tag", e.target.value.trim() ? e.target.value : undefined)
                }
                placeholder={t.tagPlaceholder}
              />
            </InputGroup>
          </Chip>
        );
    }
  };

  let list: ReactNode;
  if (status === "loading") {
    list = (
      <ul
        aria-busy
        className="mt-6 divide-y rounded-xl border bg-card shadow-xs/5"
      >
        {SKELETON_ROWS.map((key) => (
          <li className="flex items-center gap-3 px-4 py-3" key={key}>
            <Skeleton className="size-1.5 rounded-full motion-reduce:animate-none" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-40 motion-reduce:animate-none" />
              <Skeleton className="h-3 w-56 motion-reduce:animate-none" />
            </div>
          </li>
        ))}
      </ul>
    );
  } else if (status === "error") {
    list = (
      <div
        className="mt-6 flex flex-col items-center gap-1 rounded-xl border bg-card px-6 py-12 text-center"
        role="alert"
      >
        <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive-foreground">
          <CircleAlertIcon aria-hidden className="size-4.5" />
        </span>
        <p className="font-medium text-sm">{t.errorTitle}</p>
        {error ? (
          <p className="text-pretty text-muted-foreground text-xs">{error}</p>
        ) : null}
        {onRetry ? (
          <Button
            className="mt-3"
            onClick={onRetry}
            size="sm"
            variant="outline"
          >
            {t.retry}
          </Button>
        ) : null}
      </div>
    );
  } else if (customers.length === 0) {
    list = (
      <div className="mt-6 rounded-xl border border-dashed bg-card/40 p-12 text-center">
        <p className="text-muted-foreground text-sm">{t.noMatch}</p>
      </div>
    );
  } else {
    list = (
      <ul className="mt-6 divide-y rounded-xl border bg-card shadow-xs/5">
        {customers.map((c) => (
          <li
            className="flex items-center gap-3 px-4 py-3 first:rounded-t-xl last:rounded-b-xl hover:bg-background"
            key={c.id}
          >
            <span
              aria-hidden
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                STATUS_TONE[c.status]
              )}
            />
            {/* Below sm, status/MRR/last seen stack on the right instead of three fixed columns. */}
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-sm">
                {customerHref ? (
                  <WirefrontLink
                    className="rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                    href={customerHref(c)}
                  >
                    {c.name}
                  </WirefrontLink>
                ) : (
                  c.name
                )}
              </div>
              <div className="truncate font-mono text-[11px] text-muted-foreground">
                {[c.country, t[c.plan], ...c.tags].join(" · ")}
              </div>
            </div>
            <Badge
              className="h-4.5 rounded-sm px-1 font-mono text-[10px] uppercase max-sm:hidden"
              variant="outline"
            >
              {t[c.status]}
            </Badge>
            <div className="shrink-0 text-end sm:contents">
              <span className="block font-mono text-foreground text-xs tabular-nums sm:w-20">
                {money(c.mrr)}
              </span>
              <span className="block font-mono text-[11px] text-muted-foreground tabular-nums sm:w-24 sm:text-end">
                <span className="sm:hidden">{t[c.status]} · </span>
                {format.relative(c.lastActiveAt)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-xs/5 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="w-full sm:w-72">
            <InputGroupAddon>
              <SearchIcon
                aria-hidden
                className="size-4 text-muted-foreground"
              />
            </InputGroupAddon>
            <InputGroupInput
              aria-label={t.search}
              onChange={(e) => onQueryChange(withSearch(query, e.target.value))}
              placeholder={t.searchPlaceholder}
              type="search"
              value={query.search ?? ""}
            />
          </InputGroup>
          <Separator
            className="mx-1 h-6 max-sm:hidden"
            orientation="vertical"
          />
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider max-sm:hidden">
            {t.filters}
          </span>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  className="ms-1 border-dashed"
                  disabled={available.length === 0}
                  size="xs"
                  variant="outline"
                >
                  <PlusIcon />
                  {t.addFilter}
                </Button>
              }
            />
            <PopoverContent className="w-48 p-1">
              {available.map((key) => (
                <Button
                  className="w-full justify-start font-normal"
                  key={key}
                  onClick={() => {
                    setDrafts((d) => [...d, key]);
                    setEditing(key);
                  }}
                  size="sm"
                  variant="ghost"
                >
                  {label[key]}
                </Button>
              ))}
              {available.length === 0 ? (
                <p className="px-2 py-2 text-muted-foreground text-xs">
                  {t.allAdded}
                </p>
              ) : null}
            </PopoverContent>
          </Popover>
          <Button
            className="ms-auto text-muted-foreground"
            disabled={shownChips.length === 0 && !query.search}
            onClick={clearAll}
            size="xs"
            variant="ghost"
          >
            <XIcon />
            {t.clearAll}
          </Button>
        </div>

        {shownChips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {shownChips.map(chip)}
          </div>
        ) : null}

        <Separator />

        <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground text-xs">
          <span aria-live="polite">
            {status === "ready" ? (
              <>
                <span className="font-medium text-foreground">
                  {total === 1
                    ? t.matchOne
                    : interpolate(t.match, { count: total })}
                </span>{" "}
                {appliedCount === 1
                  ? t.appliedOne
                  : interpolate(t.applied, { count: appliedCount })}
              </>
            ) : null}
          </span>
          {onSaveView || onShare ? (
            <div className="flex items-center gap-2">
              {onSaveView ? (
                <Button
                  onClick={() => onSaveView(query)}
                  size="xs"
                  variant="ghost"
                >
                  {t.saveView}
                </Button>
              ) : null}
              {onShare ? (
                <Button
                  onClick={() => onShare(query)}
                  size="xs"
                  variant="outline"
                >
                  {t.share}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {list}

      {status === "ready" && pages > 1 ? (
        <nav className="mt-3 flex items-center justify-between gap-2 text-muted-foreground text-xs">
          <Button
            disabled={query.page <= 1}
            onClick={() =>
              onQueryChange(withPage(query, query.page - 1, total))
            }
            size="sm"
            variant="outline"
          >
            {t.previous}
          </Button>
          <span>{interpolate(t.pageOf, { page: query.page, pages })}</span>
          <Button
            disabled={query.page >= pages}
            onClick={() =>
              onQueryChange(withPage(query, query.page + 1, total))
            }
            size="sm"
            variant="outline"
          >
            {t.next}
          </Button>
        </nav>
      ) : null}
    </div>
  );
}

export function CustomerFilterChips(props: CustomerFilterChipsProps) {
  return (
    <ScreenBoundary name="CustomerFilterChips">
      <CustomerFilterChipsScreen {...props} />
    </ScreenBoundary>
  );
}
