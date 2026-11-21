// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import { Checkbox } from "@wirefront/ui/checkbox";
import { CheckboxGroup } from "@wirefront/ui/checkbox-group";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@wirefront/ui/input-group";
import { Label } from "@wirefront/ui/label";
import { cn } from "@wirefront/ui/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@wirefront/ui/popover";
import { Separator } from "@wirefront/ui/separator";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { pageCount, withFilter, withPage } from "@wirefront/ui/wirefront/list";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus, ListQuery } from "@wirefront/ui/wirefront/types";
import {
  CheckIcon,
  CircleAlertIcon,
  CircleDashedIcon,
  CircleDotIcon,
  CircleIcon,
  type LucideIcon,
  PlusCircleIcon,
  SearchIcon,
  TagIcon,
  UserIcon,
} from "lucide-react";
import { type ReactNode, useState } from "react";

import type { Issue, IssueFacetCounts, IssueFilters, IssueLabel, IssuePerson, IssuePriority, IssueStatus } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("issueFilterBar.<key>"). */
export const ISSUE_FILTER_BAR_MESSAGES = {
  status: "Status",
  priority: "Priority",
  assignee: "Assignee",
  label: "Label",
  todo: "Todo",
  "in-progress": "In Progress",
  "in-review": "In Review",
  done: "Done",
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
  unassigned: "Unassigned",
  filterBy: "Filter by {facet}",
  filterOptions: "Filter {facet}…",
  selectedValues: "{facet}: {values}",
  clear: "Clear",
  selectedCount: "{count} selected",
  noOptions: "No matches",
  addFilter: "Add filter",
  filtersOne: "1 filter",
  filters: "{count} filters",
  ofTotal: "{count} of {total} issues",
  resetFilters: "Reset filters",
  noMatch: "No issues match these filters.",
  errorTitle: "Couldn’t load issues.",
  retry: "Try again",
  previous: "Previous",
  next: "Next",
  pageOf: "Page {page} of {pages}",
};

export type IssuesListQuery = ListQuery<IssueFilters>;
type FacetKey = keyof IssueFilters;

export interface IssueFilterBarProps {
  /** The current page of issues. */
  issues: Issue[];
  /** Issues matching the filters across all pages. */
  total: number;
  /** All issues, ignoring the filters. Defaults to `total`. */
  overall?: number;
  /** Per-value counts shown beside each option. Hidden without it. */
  counts?: IssueFacetCounts;
  /** Everyone issues can be assigned to (listPeople). */
  people: IssuePerson[];
  /** Every label (listLabels). */
  labels: IssueLabel[];
  query: IssuesListQuery;
  /** Called when the user changes a facet or pages. Fetch the new page and pass it back in. */
  onQueryChange: (query: IssuesListQuery) => void;
  /** "loading" shows skeleton rows; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Open the builder's picker for more fields. The button hides without it. */
  onAddFilter?: () => void;
  /** Link each issue. Without it issues are plain text. */
  issueHref?: (issue: Issue) => string;
  className?: string;
}

const STATUS_ICON: Record<IssueStatus, LucideIcon> = { todo: CircleIcon, "in-progress": CircleDotIcon, "in-review": CircleDashedIcon, done: CheckIcon };
const STATUSES = Object.keys(STATUS_ICON) as IssueStatus[];
const PRIORITIES: IssuePriority[] = ["urgent", "high", "medium", "low"];
const PRIORITY_TONE: Record<IssuePriority, string> = {
  urgent: "bg-destructive",
  high: "bg-category-3",
  medium: "bg-category-1",
  low: "bg-muted-foreground/40",
};
const CATEGORY_DOT = ["", "bg-category-1", "bg-category-2", "bg-category-3", "bg-category-4", "bg-category-5", "bg-category-6", "bg-category-7", "bg-category-8"];
const CATEGORY_TINT = ["", "bg-category-1/15", "bg-category-2/15", "bg-category-3/15", "bg-category-4/15", "bg-category-5/15", "bg-category-6/15", "bg-category-7/15", "bg-category-8/15"];
const SKELETON_ROWS = ["s1", "s2", "s3", "s4", "s5"];
const tag = "h-4.5 rounded-sm px-1 font-mono text-[10px]";

export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function PriorityDot({ value }: { value: IssuePriority }) {
  return <span aria-hidden className={cn("size-2 rounded-full", PRIORITY_TONE[value])} />;
}

interface FacetOption {
  value: string;
  label: string;
  leading?: ReactNode;
}

function Facet({
  label,
  icon,
  options,
  selected,
  counts,
  onChange,
}: {
  label: string;
  icon?: ReactNode;
  options: FacetOption[];
  selected: string[];
  counts?: Record<string, number>;
  onChange: (values: string[]) => void;
}) {
  const t = useMessages("issueFilterBar", ISSUE_FILTER_BAR_MESSAGES);
  const [search, setSearch] = useState("");
  const count = selected.length;
  const labelOf = (value: string) => options.find((o) => o.value === value)?.label ?? value;
  const shown = options.filter((o) => o.label.toLowerCase().includes(search.trim().toLowerCase()));
  const placeholder = interpolate(t.filterOptions, { facet: label.toLowerCase() });

  return (
    <Popover onOpenChange={(open) => !open && setSearch("")}>
      <PopoverTrigger
        render={
          <Button className={count > 0 ? "border-foreground/20 bg-foreground/5" : "border-dashed"} size="sm" variant="outline">
            {icon ?? <PlusCircleIcon />}
            {count > 0 ? (
              <>
                {/* The selected values are only shown inline from lg; announce them always. */}
                <span className="sr-only">{interpolate(t.selectedValues, { facet: label, values: selected.map(labelOf).join(", ") })}</span>
                <span aria-hidden>{label}</span>
                <Separator className="mx-1 h-3" orientation="vertical" />
                <Badge aria-hidden className={tag} variant="secondary">
                  {count}
                </Badge>
                {count <= 2 ? (
                  <span aria-hidden className="hidden gap-1 lg:inline-flex">
                    {selected.map((s) => (
                      <Badge className={tag} key={s} variant="secondary">
                        {labelOf(s)}
                      </Badge>
                    ))}
                  </span>
                ) : null}
              </>
            ) : (
              <>
                <span className="sr-only">{interpolate(t.filterBy, { facet: label })}</span>
                <span aria-hidden>{label}</span>
              </>
            )}
          </Button>
        }
      />
      <PopoverContent className="w-[min(16rem,calc(100vw-2rem))] p-0">
        <div className="flex flex-col">
          <div className="p-2">
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon aria-hidden className="size-3.5 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput aria-label={placeholder} className="h-8 text-sm" onChange={(e) => setSearch(e.target.value)} placeholder={placeholder} value={search} />
            </InputGroup>
          </div>
          <Separator />
          <CheckboxGroup
            aria-label={label}
            className="flex max-h-[min(18rem,50svh)] flex-col overflow-y-auto p-1"
            onValueChange={onChange}
            value={selected}
          >
            {shown.map((o) => (
              <Label
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 font-normal text-sm hover:bg-accent pointer-coarse:min-h-11"
                key={o.value}
              >
                <Checkbox value={o.value} />
                {o.leading ? <span className="flex size-5 items-center justify-center">{o.leading}</span> : null}
                <span className="flex-1 truncate">{o.label}</span>
                {counts ? <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{counts[o.value] ?? 0}</span> : null}
              </Label>
            ))}
            {shown.length === 0 ? <p className="px-2 py-3 text-center text-muted-foreground text-xs">{t.noOptions}</p> : null}
          </CheckboxGroup>
          <Separator />
          <div className="flex items-center justify-between p-1">
            <Button className="text-muted-foreground" disabled={count === 0} onClick={() => onChange([])} size="xs" variant="ghost">
              {t.clear}
            </Button>
            <span className="px-2 font-mono text-[10px] text-muted-foreground tabular-nums">{interpolate(t.selectedCount, { count })}</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function IssueFilterBarScreen({
  issues,
  total,
  overall = total,
  counts,
  people,
  labels,
  query,
  onQueryChange,
  status = "ready",
  error,
  onRetry,
  onAddFilter,
  issueHref,
  className,
}: IssueFilterBarProps) {
  const t = useMessages("issueFilterBar", ISSUE_FILTER_BAR_MESSAGES);
  const filters = query.filters ?? {};
  const selected = (key: FacetKey) => (filters[key] ?? []) as string[];
  const setFacet = (key: FacetKey) => (values: string[]) => onQueryChange(withFilter(query, key, values));
  const selectedCount = (["status", "priority", "assignee", "label"] as const).reduce((n, key) => n + selected(key).length, 0);
  const reset = () => onQueryChange({ ...query, filters: undefined, page: 1 });
  const pages = pageCount(query, total);
  const personTone = (id: string) => CATEGORY_TINT[(people.findIndex((p) => p.id === id) % 8) + 1];
  const personById = new Map(people.map((p) => [p.id, p]));
  const labelById = new Map(labels.map((l) => [l.id, l]));

  let list: ReactNode;
  if (status === "loading") {
    list = (
      <ul aria-busy className="mt-6 divide-y rounded-xl border bg-card shadow-xs/5">
        {SKELETON_ROWS.map((key) => (
          <li className="flex items-center gap-3 px-4 py-3" key={key}>
            <Skeleton className="size-3.5 rounded-full motion-reduce:animate-none" />
            <Skeleton className="h-3 w-14 motion-reduce:animate-none" />
            <Skeleton className="h-3.5 w-56 motion-reduce:animate-none" />
          </li>
        ))}
      </ul>
    );
  } else if (status === "error") {
    list = (
      <div className="mt-6 flex flex-col items-center gap-1 rounded-xl border bg-card px-6 py-12 text-center" role="alert">
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
  } else if (issues.length === 0) {
    list = (
      <div className="mt-6 rounded-xl border border-dashed bg-card/40 p-12 text-center">
        <p className="text-muted-foreground text-sm">{t.noMatch}</p>
        {selectedCount > 0 ? (
          <Button className="mt-3" onClick={reset} size="sm" variant="outline">
            {t.resetFilters}
          </Button>
        ) : null}
      </div>
    );
  } else {
    list = (
      <ul className="mt-6 divide-y rounded-xl border bg-card shadow-xs/5">
        {issues.map((issue) => {
          const StatusIcon = STATUS_ICON[issue.status];
          const assignee = issue.assigneeId ? personById.get(issue.assigneeId) : undefined;
          return (
            <li className="flex items-center gap-3 px-4 py-3 first:rounded-t-xl last:rounded-b-xl hover:bg-background" key={issue.id}>
              <StatusIcon aria-label={t[issue.status]} className="size-3.5 shrink-0 text-muted-foreground" role="img" />
              <PriorityDot value={issue.priority} />
              <span className="sr-only">{t[issue.priority]}</span>
              <span className="font-mono text-[11px] text-muted-foreground">{issue.key}</span>
              {issueHref ? (
                <WirefrontLink
                  className="min-w-0 flex-1 truncate rounded-sm text-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  href={issueHref(issue)}
                >
                  {issue.title}
                </WirefrontLink>
              ) : (
                <span className="min-w-0 flex-1 truncate text-sm">{issue.title}</span>
              )}
              <div className="hidden items-center gap-1.5 sm:flex">
                {issue.labelIds.map((id) => {
                  const meta = labelById.get(id);
                  if (!meta) return null;
                  return (
                    <span className="inline-flex items-center gap-1 rounded-full border bg-background px-1.5 py-0.5 text-[10px]" key={id}>
                      <span aria-hidden className={cn("size-1.5 rounded-full", CATEGORY_DOT[meta.color])} />
                      {meta.name}
                    </span>
                  );
                })}
              </div>
              <span className="text-muted-foreground text-xs">
                {assignee ? <abbr className="no-underline" title={assignee.name}>{initialsOf(assignee.name)}</abbr> : <span className="sr-only">{t.unassigned}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className={className}>
      <div className="rounded-xl border bg-card p-4 shadow-xs/5">
        <div className="flex flex-wrap items-center gap-2">
          <Facet
            counts={counts?.status}
            label={t.status}
            onChange={setFacet("status")}
            options={STATUSES.map((value) => {
              const Icon = STATUS_ICON[value];
              return { value, label: t[value], leading: <Icon aria-hidden className="size-3.5 text-muted-foreground" /> };
            })}
            selected={selected("status")}
          />
          <Facet
            counts={counts?.priority}
            label={t.priority}
            onChange={setFacet("priority")}
            options={PRIORITIES.map((value) => ({ value, label: t[value], leading: <PriorityDot value={value} /> }))}
            selected={selected("priority")}
          />
          <Facet
            counts={counts?.assignee}
            icon={<UserIcon className="size-3.5" />}
            label={t.assignee}
            onChange={setFacet("assignee")}
            options={people.map((p) => ({
              value: p.id,
              label: p.name,
              leading: (
                <span aria-hidden className={cn("flex size-5 items-center justify-center rounded-full font-medium text-[9px]", personTone(p.id))}>
                  {initialsOf(p.name)}
                </span>
              ),
            }))}
            selected={selected("assignee")}
          />
          <Facet
            counts={counts?.label}
            icon={<TagIcon className="size-3.5" />}
            label={t.label}
            onChange={setFacet("label")}
            options={labels.map((l) => ({ value: l.id, label: l.name, leading: <span aria-hidden className={cn("size-2 rounded-full", CATEGORY_DOT[l.color])} /> }))}
            selected={selected("label")}
          />

          {onAddFilter ? (
            <>
              <Separator className="mx-1 h-6" orientation="vertical" />
              <Button className="border-dashed" onClick={onAddFilter} size="sm" variant="outline">
                <PlusCircleIcon />
                {t.addFilter}
              </Button>
            </>
          ) : null}
        </div>

        <Separator className="my-3" />

        <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground text-xs">
          <span aria-live="polite">
            <span className="text-foreground">{selectedCount === 1 ? t.filtersOne : interpolate(t.filters, { count: selectedCount })}</span>
            {status === "ready" ? <> · {interpolate(t.ofTotal, { count: total, total: overall })}</> : null}
          </span>
          <Button disabled={selectedCount === 0} onClick={reset} size="xs" variant="ghost">
            {t.resetFilters}
          </Button>
        </div>
      </div>

      {list}

      {status === "ready" && pages > 1 ? (
        <nav className="mt-3 flex items-center justify-between gap-2 text-muted-foreground text-xs">
          <Button disabled={query.page <= 1} onClick={() => onQueryChange(withPage(query, query.page - 1, total))} size="sm" variant="outline">
            {t.previous}
          </Button>
          <span>{interpolate(t.pageOf, { page: query.page, pages })}</span>
          <Button disabled={query.page >= pages} onClick={() => onQueryChange(withPage(query, query.page + 1, total))} size="sm" variant="outline">
            {t.next}
          </Button>
        </nav>
      ) : null}
    </div>
  );
}

export function IssueFilterBar(props: IssueFilterBarProps) {
  return (
    <ScreenBoundary name="IssueFilterBar">
      <IssueFilterBarScreen {...props} />
    </ScreenBoundary>
  );
}
