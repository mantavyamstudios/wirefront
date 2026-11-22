// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@wirefront/ui/input-group";
import { Kbd } from "@wirefront/ui/kbd";
import { cn } from "@wirefront/ui/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wirefront/ui/select";
import { Separator } from "@wirefront/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@wirefront/ui/sheet";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@wirefront/ui/toggle-group";
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
  WirefrontLink,
} from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus, ListQuery } from "@wirefront/ui/wirefront/types";
import {
  CalendarIcon,
  CircleAlertIcon,
  LayoutGridIcon,
  ListFilterIcon,
  RowsIcon,
  SearchIcon,
  Settings2Icon,
  XIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import type { ListedProject, ProjectFilters, ProjectStatus } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("projectsToolbar.<key>"). */
export const PROJECTS_TOOLBAR_MESSAGES = {
  search: "Search projects",
  searchPlaceholder: "Search projects…",
  status: "Status",
  allStatuses: "All statuses",
  active: "Active",
  paused: "Paused",
  archived: "Archived",
  owner: "Owner",
  anyone: "Anyone",
  me: "Just me",
  team: "My team",
  lastActive: "Last active",
  anyTime: "Any time",
  lastDays: "Last {count} days",
  moreFilters: "More filters",
  filters: "Filters",
  clear: "Clear",
  showResultsOne: "Show 1 result",
  showResults: "Show {count} results",
  density: "Density",
  rows: "Rows",
  grid: "Grid",
  viewOptions: "View options",
  savedView: "Saved view:",
  newView: "New view",
  showing: "Showing {count} of {total} projects",
  clearCount: "Clear ({count})",
  noMatch: "No projects match these filters.",
  resetFilters: "Reset filters",
  errorTitle: "Couldn’t load projects.",
  retry: "Try again",
  membersOne: "1 member",
  members: "{count} members",
  previous: "Previous",
  next: "Next",
  pageOf: "Page {page} of {pages}",
};

export type ProjectsListQuery = ListQuery<ProjectFilters>;

/** A saved set of filters the user can switch to. */
export interface SavedProjectView {
  id: string;
  label: string;
  query: ProjectsListQuery;
}

export interface ProjectsToolbarProps {
  /** The current page of projects. */
  projects: ListedProject[];
  /** Projects matching the query across all pages. */
  total: number;
  /** All projects, ignoring the query; for "Showing 12 of 40". Defaults to `total`. */
  overall?: number;
  query: ProjectsListQuery;
  /** Called when the user searches, filters or pages. Fetch the new page and pass it back in. */
  onQueryChange: (query: ProjectsListQuery) => void;
  /** "loading" shows skeleton rows; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** "Last active" choices in days. */
  activeWithinOptions?: number[];
  savedViews?: SavedProjectView[];
  /** Start a new saved view from the current query. The button hides without it. */
  onCreateView?: (query: ProjectsListQuery) => void;
  /** Open the builder's advanced filters. The button hides without it. */
  onMoreFilters?: () => void;
  /** Open the builder's view options. The button hides without it. */
  onViewOptions?: () => void;
  /** Link each project. Without it projects are plain text. */
  projectHref?: (project: ListedProject) => string;
  defaultDensity?: "rows" | "grid";
  className?: string;
}

const ANY = "any";
const STATUS_TONE: Record<ProjectStatus, string> = {
  active: "bg-category-2",
  paused: "bg-category-3",
  archived: "bg-muted-foreground/40",
};
const SKELETON_ROWS = ["s1", "s2", "s3", "s4", "s5"];

function StatusDot({ status }: { status: ProjectStatus }) {
  return (
    <span
      aria-hidden
      className={cn("size-1.5 shrink-0 rounded-full", STATUS_TONE[status])}
    />
  );
}

function ProjectsToolbarScreen({
  projects,
  total,
  overall = total,
  query,
  onQueryChange,
  status = "ready",
  error,
  onRetry,
  activeWithinOptions = [7, 30, 90],
  savedViews,
  onCreateView,
  onMoreFilters,
  onViewOptions,
  projectHref,
  defaultDensity = "rows",
  className,
}: ProjectsToolbarProps) {
  const t = useMessages("projectsToolbar", PROJECTS_TOOLBAR_MESSAGES);
  const format = useFormat();
  const [density, setDensity] = useState(defaultDensity);
  const search = useRef<HTMLInputElement>(null);
  const filters = query.filters ?? {};
  const activeCount = (query.search ? 1 : 0) + Object.keys(filters).length;
  const pages = pageCount(query, total);

  // "/" jumps to search, as the hint in the field says.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey)
        return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("input, textarea, select, [contenteditable='true']")
      )
        return;
      event.preventDefault();
      search.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const setFilter = (key: keyof ProjectFilters, value: unknown) =>
    onQueryChange(withFilter(query, key, value === ANY ? undefined : value));
  const reset = () =>
    onQueryChange({ ...query, search: undefined, filters: undefined, page: 1 });

  const statuses = [
    { value: ANY, label: t.allStatuses },
    { value: "active", label: t.active },
    { value: "paused", label: t.paused },
    { value: "archived", label: t.archived },
  ];
  const owners = [
    { value: ANY, label: t.anyone },
    { value: "me", label: t.me },
    { value: "team", label: t.team },
  ];
  const ranges = [
    { value: ANY, label: t.anyTime },
    ...activeWithinOptions.map((days) => ({
      value: String(days),
      label: interpolate(t.lastDays, { count: days }),
    })),
  ];

  // The same controls render inline from md up and inside a bottom sheet on
  // phones; `stacked` makes each one full-width.
  const filterFields = (stacked: boolean) => (
    <>
      <Select
        items={statuses}
        onValueChange={(v) => setFilter("status", v ?? ANY)}
        value={filters.status ?? ANY}
      >
        <SelectTrigger
          aria-label={t.status}
          className={stacked ? "w-full" : "w-36"}
          size={stacked ? "default" : "sm"}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          {statuses.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        items={owners}
        onValueChange={(v) => setFilter("owner", v ?? ANY)}
        value={filters.owner ?? ANY}
      >
        <SelectTrigger
          aria-label={t.owner}
          className={stacked ? "w-full" : "w-32"}
          size={stacked ? "default" : "sm"}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          {owners.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        items={ranges}
        onValueChange={(v) =>
          setFilter("activeWithinDays", !v || v === ANY ? undefined : Number(v))
        }
        value={
          filters.activeWithinDays ? String(filters.activeWithinDays) : ANY
        }
      >
        <SelectTrigger
          aria-label={t.lastActive}
          className={stacked ? "w-full" : "w-44"}
          size={stacked ? "default" : "sm"}
        >
          <CalendarIcon aria-hidden className="text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          {ranges.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );

  const name = (p: ListedProject, extra?: string) =>
    projectHref ? (
      <WirefrontLink
        className={cn(
          "rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring",
          extra
        )}
        href={projectHref(p)}
      >
        {p.name}
      </WirefrontLink>
    ) : (
      <span className={extra}>{p.name}</span>
    );

  let results: ReactNode;
  if (status === "loading") {
    results = (
      <ul
        aria-busy
        className="mt-6 divide-y rounded-xl border bg-card shadow-xs/5"
      >
        {SKELETON_ROWS.map((key) => (
          <li className="flex items-center gap-3 px-4 py-3" key={key}>
            <Skeleton className="size-1.5 rounded-full motion-reduce:animate-none" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-40 motion-reduce:animate-none" />
              <Skeleton className="h-3 w-28 motion-reduce:animate-none" />
            </div>
          </li>
        ))}
      </ul>
    );
  } else if (status === "error") {
    results = (
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
  } else if (projects.length === 0) {
    results = (
      <div className="mt-6 rounded-xl border border-dashed bg-card/40 p-12 text-center">
        <p className="text-muted-foreground text-sm">{t.noMatch}</p>
        {activeCount > 0 ? (
          <Button className="mt-3" onClick={reset} size="sm" variant="outline">
            {t.resetFilters}
          </Button>
        ) : null}
      </div>
    );
  } else if (density === "grid") {
    results = (
      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <li className="rounded-xl border bg-card p-4 shadow-xs/5" key={p.id}>
            <div className="flex items-center gap-2">
              <StatusDot status={p.status} />
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                {t[p.status]}
              </span>
            </div>
            <div className="mt-2 font-medium text-sm">{name(p)}</div>
            <div className="mt-1 flex items-center justify-between text-muted-foreground text-xs">
              <span>{p.ownerName}</span>
              <span className="font-mono tabular-nums">
                {format.relative(p.lastActiveAt)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    );
  } else {
    results = (
      <ul className="mt-6 divide-y rounded-xl border bg-card shadow-xs/5">
        {projects.map((p) => (
          <li
            className="flex items-center gap-3 px-4 py-3 first:rounded-t-xl last:rounded-b-xl hover:bg-background"
            key={p.id}
          >
            <StatusDot status={p.status} />
            <span className="sr-only">{t[p.status]}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-sm">{name(p)}</div>
              <div className="text-muted-foreground text-xs">
                {p.ownerName} ·{" "}
                {p.members === 1
                  ? t.membersOne
                  : interpolate(t.members, { count: p.members })}
              </div>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
              {format.relative(p.lastActiveAt)}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-xs/5">
        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="min-w-0 flex-1 md:w-64 md:flex-none">
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
              ref={search}
              type="search"
              value={query.search ?? ""}
            />
            <InputGroupAddon
              align="inline-end"
              className="pointer-coarse:hidden"
            >
              <Kbd>/</Kbd>
            </InputGroupAddon>
          </InputGroup>

          <Separator
            className="mx-1 h-6 max-md:hidden"
            orientation="vertical"
          />

          <div className="contents max-md:hidden">
            {filterFields(false)}
            {onMoreFilters ? (
              <Button onClick={onMoreFilters} size="sm" variant="ghost">
                <ListFilterIcon />
                {t.moreFilters}
              </Button>
            ) : null}
          </div>

          {/* Phones: one "Filters" button opens the same controls in a sheet. */}
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  className="pointer-coarse:h-10 md:hidden"
                  size="sm"
                  variant="outline"
                />
              }
            >
              <ListFilterIcon />
              {t.filters}
              {activeCount > 0 ? (
                <Badge
                  className="ms-1 h-4.5 rounded-sm px-1 font-mono text-[0.625rem]"
                  variant="secondary"
                >
                  {activeCount}
                </Badge>
              ) : null}
            </SheetTrigger>
            <SheetContent
              className="pb-[env(safe-area-inset-bottom)]"
              side="bottom"
            >
              <SheetHeader>
                <SheetTitle>{t.filters}</SheetTitle>
              </SheetHeader>
              <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto px-4">
                {filterFields(true)}
                {onMoreFilters ? (
                  <Button onClick={onMoreFilters} variant="outline">
                    <ListFilterIcon />
                    {t.moreFilters}
                  </Button>
                ) : null}
              </div>
              <SheetFooter>
                <Button
                  disabled={activeCount === 0}
                  onClick={reset}
                  variant="ghost"
                >
                  {t.clear}
                </Button>
                <SheetClose render={<Button />}>
                  {total === 1
                    ? t.showResultsOne
                    : interpolate(t.showResults, { count: total })}
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <div className="ms-auto flex items-center gap-2 max-sm:hidden">
            <ToggleGroup
              aria-label={t.density}
              onValueChange={(v) => {
                const next = (v as string[])[0];
                if (next === "rows" || next === "grid") setDensity(next);
              }}
              value={[density]}
            >
              <ToggleGroupItem aria-label={t.rows} size="sm" value="rows">
                <RowsIcon />
              </ToggleGroupItem>
              <ToggleGroupItem aria-label={t.grid} size="sm" value="grid">
                <LayoutGridIcon />
              </ToggleGroupItem>
            </ToggleGroup>
            {onViewOptions ? (
              <Button
                aria-label={t.viewOptions}
                onClick={onViewOptions}
                size="icon-sm"
                variant="outline"
              >
                <Settings2Icon />
              </Button>
            ) : null}
          </div>
        </div>

        <Separator />

        <div className="flex flex-wrap items-center gap-2">
          {savedViews?.length || onCreateView ? (
            <span className="text-muted-foreground text-xs">{t.savedView}</span>
          ) : null}
          {savedViews?.map((view) => (
            <Button
              className="font-mono"
              key={view.id}
              onClick={() => onQueryChange({ ...view.query, page: 1 })}
              size="xs"
              variant="secondary"
            >
              {view.label}
            </Button>
          ))}
          {onCreateView ? (
            <Button
              className="text-muted-foreground"
              onClick={() => onCreateView(query)}
              size="xs"
              variant="ghost"
            >
              + {t.newView}
            </Button>
          ) : null}
          <span
            aria-live="polite"
            className="inline-flex w-full items-center gap-1.5 text-muted-foreground text-xs sm:ms-auto sm:w-auto"
          >
            <span
              aria-hidden
              className={cn(
                "size-1.5 rounded-full",
                total === 0 ? "bg-destructive" : "bg-category-2"
              )}
            />
            {status === "ready"
              ? interpolate(t.showing, { count: total, total: overall })
              : null}
            {activeCount > 0 ? (
              <Button
                className="-me-2 h-6 px-1.5 text-muted-foreground pointer-coarse:h-9 max-sm:ms-auto"
                onClick={reset}
                size="xs"
                variant="ghost"
              >
                <XIcon /> {interpolate(t.clearCount, { count: activeCount })}
              </Button>
            ) : null}
          </span>
        </div>
      </div>

      {results}

      {status === "ready" && pages > 1 ? (
        <nav className="flex items-center justify-between gap-2 text-muted-foreground text-xs">
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

export function ProjectsToolbar(props: ProjectsToolbarProps) {
  return (
    <ScreenBoundary name="ProjectsToolbar">
      <ProjectsToolbarScreen {...props} />
    </ScreenBoundary>
  );
}
