// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

/**
 * The list pattern (SCREEN-CONTRACT.md, rule 4): lists are controlled by a
 * ListQuery the builder sends to their API. Screens derive the next query with
 * these pure helpers and report it through `onQueryChange`; `useListQuery`
 * holds the query for builders (and demos) that don't keep it in the URL.
 */
import { useCallback, useMemo, useState } from "react";

import type { ListQuery } from "./types";

export const DEFAULT_QUERY: ListQuery = { page: 1, pageSize: 20 };

/** Cycle a column's sort: ascending → descending → off. Back to page 1. */
export function toggleSort<Q extends ListQuery>(query: Q, id: string): Q {
  const current = query.sort?.id === id ? query.sort.direction : undefined;
  const sort = current === undefined ? { id, direction: "asc" as const } : current === "asc" ? { id, direction: "desc" as const } : undefined;
  return { ...query, sort, page: 1 };
}

/** Change the search text. Back to page 1. */
export function withSearch<Q extends ListQuery>(query: Q, search: string): Q {
  return { ...query, search: search || undefined, page: 1 };
}

/** Set or clear one filter. Back to page 1. */
export function withFilter<Q extends ListQuery>(query: Q, key: string, value: unknown): Q {
  const filters = { ...query.filters } as Record<string, unknown>;
  if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) delete filters[key];
  else filters[key] = value;
  return { ...query, filters: Object.keys(filters).length ? (filters as Q["filters"]) : undefined, page: 1 };
}

/** Go to a page, kept within 1…pageCount when the total is known. */
export function withPage<Q extends ListQuery>(query: Q, page: number, total?: number): Q {
  const last = total === undefined ? Number.POSITIVE_INFINITY : Math.max(1, Math.ceil(total / query.pageSize));
  return { ...query, page: Math.min(Math.max(1, Math.trunc(page)), last) };
}

/** Change the page size, keeping the first visible row on screen. */
export function withPageSize<Q extends ListQuery>(query: Q, pageSize: number): Q {
  const firstRow = (query.page - 1) * query.pageSize;
  return { ...query, pageSize, page: Math.floor(firstRow / pageSize) + 1 };
}

export function pageCount(query: ListQuery, total: number): number {
  return Math.max(1, Math.ceil(total / query.pageSize));
}

/** Hold a ListQuery in state with the helpers above bound to it. */
export function useListQuery<Q extends ListQuery = ListQuery>(initial?: Partial<Q>) {
  const [query, setQuery] = useState<Q>({ ...DEFAULT_QUERY, ...initial } as Q);
  const actions = useMemo(
    () => ({
      setQuery,
      toggleSort: (id: string) => setQuery((q) => toggleSort(q, id)),
      setSearch: (search: string) => setQuery((q) => withSearch(q, search)),
      setFilter: (key: string, value: unknown) => setQuery((q) => withFilter(q, key, value)),
      setPage: (page: number, total?: number) => setQuery((q) => withPage(q, page, total)),
      setPageSize: (size: number) => setQuery((q) => withPageSize(q, size)),
    }),
    [],
  );
  return [query, actions] as const;
}

/** Row selection over the ids currently shown, for bulk actions. */
export function useSelection<Id extends string | number>(ids: readonly Id[]) {
  const [selected, setSelected] = useState<ReadonlySet<Id>>(new Set());
  const visible = useMemo(() => new Set(ids), [ids]);
  // Only ids still shown count as selected (rows can disappear after a refetch).
  const current = useMemo(() => new Set([...selected].filter((id) => visible.has(id))), [selected, visible]);
  const toggle = useCallback((id: Id) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const allSelected = ids.length > 0 && current.size === ids.length;
  return {
    selected: current as ReadonlySet<Id>,
    isSelected: (id: Id) => current.has(id),
    toggle,
    toggleAll: () => setSelected(allSelected ? new Set() : new Set(ids)),
    clear: () => setSelected(new Set()),
    allSelected,
    someSelected: current.size > 0 && !allSelected,
  };
}
