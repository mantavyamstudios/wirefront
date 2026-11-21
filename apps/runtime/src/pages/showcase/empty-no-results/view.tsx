// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@wirefront/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@wirefront/ui/input-group";
import { cn } from "@wirefront/ui/lib/utils";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { SearchIcon, XIcon } from "lucide-react";

import type { ActiveFilter } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("noResults.<key>"). */
export const NO_RESULTS_MESSAGES = {
  search: "Search",
  searchPlaceholder: "Search…",
  filters: "Filters",
  removeFilter: "Remove {label}",
  clearAll: "Clear all",
  title: "No matches",
  withQuery: "We couldn’t find anything for “{query}”.",
  withFilters: "Try removing a filter or searching for a different term.",
  withoutFilters: "Try searching for a different term.",
  clearFilters: "Clear filters",
  resetSearch: "Reset search",
};

export interface NoResultsStateProps {
  /** The search that found nothing. */
  query?: string;
  /** How many filters are active (changes the advice). */
  filterCount?: number;
  /** Clear every filter. The button only shows when this is given and filters are active. */
  onClearFilters?: () => void;
  /** Clear the search. The button only shows when this is given and there is a query. */
  onClearSearch?: () => void;
  className?: string;
}

/** The empty state on its own, for any list or table whose query found nothing. */
function NoResultsStateScreen({ query, filterCount = 0, onClearFilters, onClearSearch, className }: NoResultsStateProps) {
  const t = useMessages("noResults", NO_RESULTS_MESSAGES);
  const canClearFilters = Boolean(onClearFilters && filterCount > 0);
  const canClearSearch = Boolean(onClearSearch && query);
  return (
    <div className={cn("rounded-xl border border-border/70 border-dashed bg-background/40", className)}>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>{t.title}</EmptyTitle>
          <EmptyDescription>
            {query ? `${interpolate(t.withQuery, { query })} ` : null}
            {filterCount > 0 ? t.withFilters : t.withoutFilters}
          </EmptyDescription>
        </EmptyHeader>
        {canClearFilters || canClearSearch ? (
          <EmptyContent>
            <div className="flex items-center gap-2">
              {canClearFilters ? (
                <Button onClick={onClearFilters} size="sm" variant="outline">
                  {t.clearFilters}
                </Button>
              ) : null}
              {canClearSearch ? (
                <Button onClick={onClearSearch} size="sm" variant="ghost">
                  {t.resetSearch}
                </Button>
              ) : null}
            </div>
          </EmptyContent>
        ) : null}
      </Empty>
    </div>
  );
}

export interface NoResultsProps {
  /** The search box's value. */
  query: string;
  onQueryChange: (query: string) => void;
  /** Active filters, shown as removable chips. */
  filters: ActiveFilter[];
  /** Remove one filter (receives its id). */
  onRemoveFilter: (id: string) => void;
  /** Remove every filter. */
  onClearFilters: () => void;
  /** Placeholder for the search box, e.g. "Search invoices…". */
  searchPlaceholder?: string;
  className?: string;
}

/** A search with filter chips above the empty state: the page a filtered list shows when nothing matches. */
function NoResultsScreen({ query, onQueryChange, filters, onRemoveFilter, onClearFilters, searchPlaceholder, className }: NoResultsProps) {
  const t = useMessages("noResults", NO_RESULTS_MESSAGES);
  return (
    <div className={cn("min-h-svh bg-background px-4 py-8 sm:px-6 sm:py-12", className)}>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            aria-label={t.search}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={searchPlaceholder ?? t.searchPlaceholder}
            type="search"
            value={query}
          />
        </InputGroup>

        {filters.length ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{t.filters}</span>
            {filters.map((f) => (
              <Badge className="gap-1 font-mono text-[11px]" key={f.id} variant="outline">
                {f.label}
                <button
                  aria-label={interpolate(t.removeFilter, { label: f.label })}
                  className="-my-1 -me-1.5 flex size-6 items-center justify-center rounded-sm opacity-60 hover:opacity-100 pointer-coarse:size-8"
                  onClick={() => onRemoveFilter(f.id)}
                  type="button"
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            ))}
            <Button className="ms-1" onClick={onClearFilters} size="xs" variant="ghost">
              {t.clearAll}
            </Button>
          </div>
        ) : null}

        <NoResultsState filterCount={filters.length} onClearFilters={onClearFilters} onClearSearch={() => onQueryChange("")} query={query} />
      </div>
    </div>
  );
}

export function NoResultsState(props: NoResultsStateProps) {
  return (
    <ScreenBoundary name="NoResultsState">
      <NoResultsStateScreen {...props} />
    </ScreenBoundary>
  );
}

export function NoResults(props: NoResultsProps) {
  return (
    <ScreenBoundary name="NoResults">
      <NoResultsScreen {...props} />
    </ScreenBoundary>
  );
}
