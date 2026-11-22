// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Badge } from "@wirefront/ui/badge";
import { Button, buttonVariants } from "@wirefront/ui/button";
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
import { Separator } from "@wirefront/ui/separator";
import { Skeleton } from "@wirefront/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@wirefront/ui/table";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  pageCount,
  toggleSort,
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
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleDashedIcon,
  CircleDotIcon,
  CircleIcon,
  type LucideIcon,
  PlusCircleIcon,
  PlusIcon,
  SearchIcon,
  TagIcon,
  UserIcon,
} from "lucide-react";
import { type ReactNode, useState } from "react";

import type {
  TrackerFilters,
  TrackerIssue,
  TrackerLabel,
  TrackerPage,
  TrackerPerson,
  TrackerPriority,
  TrackerStatus,
} from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("issuesTable.<key>"). */
export const ISSUES_TABLE_MESSAGES = {
  title: "Issues",
  countOne: "1 issue",
  countOther: "{count} issues",
  newIssue: "New issue",
  search: "Search issues",
  searchPlaceholder: "Search issues…",
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
  medium: "Med",
  low: "Low",
  none: "—",
  noPriority: "No priority",
  filterBy: "Filter by {facet}",
  filterOptions: "Filter {facet}…",
  selectedValues: "{facet}: {values}",
  clear: "Clear",
  noOptions: "No matches",
  addFilter: "Add filter",
  activeOne: "1 filter",
  activeOther: "{count} filters",
  active: "active",
  columnId: "ID",
  columnTitle: "Title",
  columnPriority: "Priority",
  columnEstimate: "Estimate",
  columnAssignee: "Assignee",
  columnUpdated: "Updated",
  noEstimate: "—",
  points: "{count} points",
  unassigned: "Unassigned",
  emptyTitle: "No issues yet",
  emptyDescription: "Issues you create will show up here.",
  noMatchTitle: "No issues match",
  noMatchDescription: "Try a different search or fewer filters.",
  clearFilters: "Clear filters",
  errorTitle: "Couldn’t load issues",
  retry: "Try again",
  pagination: "Pagination",
  previous: "Previous page",
  next: "Next page",
  range: "{from}–{to} of {total}",
};

export type IssuesTableListQuery = ListQuery<TrackerFilters>;
type FacetKey = keyof TrackerFilters;

export interface IssuesTableProps {
  /** The current page and its total. Leave out while loading. */
  page?: TrackerPage;
  /** Search, facets, sort and page; send it to your API (see `TrackerQuery` in schema.ts). */
  query: IssuesTableListQuery;
  onQueryChange: (query: IssuesTableListQuery) => void;
  /** Everyone issues can be assigned to (listPeople). */
  people: TrackerPerson[];
  /** Every label (listLabels). */
  labels: TrackerLabel[];
  /** "loading" shows skeleton rows; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** A line under the title, e.g. the team and cycle. */
  subtitle?: string;
  /** Where "New issue" goes. Hidden when not given. */
  newIssueHref?: string;
  /** Open the builder's picker for more fields. Hidden when not given. */
  onAddFilter?: () => void;
  /** Where an issue's title links to. Plain text when not given. */
  issueHref?: (issue: TrackerIssue) => string;
  className?: string;
}

const STATUS: Record<TrackerStatus, { icon: LucideIcon; className: string }> = {
  todo: { icon: CircleIcon, className: "text-muted-foreground" },
  "in-progress": {
    icon: CircleDotIcon,
    className: "text-category-3-foreground",
  },
  "in-review": {
    icon: CircleDashedIcon,
    className: "text-category-5-foreground",
  },
  done: { icon: CheckIcon, className: "text-success-foreground" },
};
const STATUSES = Object.keys(STATUS) as TrackerStatus[];
const PRIORITY_CLASS: Record<TrackerPriority, string> = {
  urgent: "border-destructive/30 text-destructive-foreground",
  high: "border-category-3/30 text-category-3-foreground",
  medium: "border-category-1/30 text-category-1-foreground",
  low: "border-border text-muted-foreground",
  none: "border-dashed text-muted-foreground",
};
const PRIORITIES: TrackerPriority[] = [
  "urgent",
  "high",
  "medium",
  "low",
  "none",
];
const LABEL_CLASS = [
  "",
  "border-category-1/20 bg-category-1/10 text-category-1-foreground",
  "border-category-2/20 bg-category-2/10 text-category-2-foreground",
  "border-category-3/20 bg-category-3/10 text-category-3-foreground",
  "border-category-4/20 bg-category-4/10 text-category-4-foreground",
  "border-category-5/20 bg-category-5/10 text-category-5-foreground",
  "border-category-6/20 bg-category-6/10 text-category-6-foreground",
  "border-category-7/20 bg-category-7/10 text-category-7-foreground",
  "border-category-8/20 bg-category-8/10 text-category-8-foreground",
];
const AVATAR_TINT = [
  "bg-category-1/15",
  "bg-category-2/15",
  "bg-category-3/15",
  "bg-category-4/15",
  "bg-category-5/15",
  "bg-category-6/15",
  "bg-category-7/15",
  "bg-category-8/15",
];
const SKELETON_ROWS = ["s1", "s2", "s3", "s4", "s5"];
const tag = "h-4.5 rounded-sm px-1 text-[0.625rem]";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

function Facet({
  label,
  icon,
  options,
  selected,
  onChange,
}: {
  label: string;
  icon?: ReactNode;
  options: { value: string; label: string; content?: ReactNode }[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const t = useMessages("issuesTable", ISSUES_TABLE_MESSAGES);
  const [search, setSearch] = useState("");
  const count = selected.length;
  const labelOf = (value: string) =>
    options.find((o) => o.value === value)?.label ?? value;
  const shown = options.filter((o) =>
    o.label.toLowerCase().includes(search.trim().toLowerCase())
  );
  const placeholder = interpolate(t.filterOptions, {
    facet: label.toLowerCase(),
  });
  return (
    <Popover onOpenChange={(open) => !open && setSearch("")}>
      <PopoverTrigger
        render={
          <Button
            className={
              count ? "border-foreground/20 bg-foreground/5" : "border-dashed"
            }
            size="sm"
            variant="outline"
          >
            {icon ?? <PlusCircleIcon />}
            {count ? (
              <>
                <span className="sr-only">
                  {interpolate(t.selectedValues, {
                    facet: label,
                    values: selected.map(labelOf).join(", "),
                  })}
                </span>
                <span aria-hidden>{label}</span>
                <Separator className="mx-1 h-3" orientation="vertical" />
                {count <= 2 ? (
                  selected.map((value) => (
                    <Badge
                      aria-hidden
                      className={cn(tag, "font-mono text-[10px]")}
                      key={value}
                      variant="secondary"
                    >
                      {labelOf(value)}
                    </Badge>
                  ))
                ) : (
                  <Badge
                    aria-hidden
                    className={cn(tag, "font-mono text-[10px]")}
                    variant="secondary"
                  >
                    {count}
                  </Badge>
                )}
              </>
            ) : (
              <>
                <span className="sr-only">
                  {interpolate(t.filterBy, { facet: label })}
                </span>
                <span aria-hidden>{label}</span>
              </>
            )}
          </Button>
        }
      />
      <PopoverContent className="w-60 p-0">
        <div className="p-2">
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon
                aria-hidden
                className="size-3.5 text-muted-foreground"
              />
            </InputGroupAddon>
            <InputGroupInput
              aria-label={placeholder}
              className="h-8 text-sm"
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              value={search}
            />
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
              {o.content ?? o.label}
            </Label>
          ))}
          {shown.length === 0 ? (
            <p className="px-2 py-3 text-center text-muted-foreground text-xs">
              {t.noOptions}
            </p>
          ) : null}
        </CheckboxGroup>
        <Separator />
        <div className="p-1">
          <Button
            className="text-muted-foreground"
            disabled={count === 0}
            onClick={() => onChange([])}
            size="xs"
            variant="ghost"
          >
            {t.clear}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function IssuesTableScreen({
  page,
  query,
  onQueryChange,
  people,
  labels,
  status = "ready",
  error,
  onRetry,
  subtitle,
  newIssueHref,
  onAddFilter,
  issueHref,
  className,
}: IssuesTableProps) {
  const t = useMessages("issuesTable", ISSUES_TABLE_MESSAGES);
  const format = useFormat();
  const items = page?.items ?? [];
  const total = page?.total ?? 0;
  const pages = pageCount(query, total);
  const from = total === 0 ? 0 : (query.page - 1) * query.pageSize + 1;
  const to = Math.min(query.page * query.pageSize, total);
  const filters = query.filters ?? {};
  const selected = (key: FacetKey) => (filters[key] ?? []) as string[];
  const setFacet = (key: FacetKey) => (values: string[]) =>
    onQueryChange(withFilter(query, key, values));
  const activeCount = (
    ["status", "priority", "assignee", "label"] as const
  ).filter((key) => selected(key).length).length;
  const filtered = Boolean(query.search) || activeCount > 0;
  const personById = new Map(
    people.map((p, i) => [
      p.id,
      { ...p, tint: AVATAR_TINT[i % AVATAR_TINT.length] },
    ])
  );
  const labelById = new Map(labels.map((l) => [l.id, l]));
  const priorityLabel = (p: TrackerPriority) =>
    p === "none" ? t.noPriority : t[p];

  const priorityBadge = (p: TrackerPriority, extra?: string) => (
    <Badge
      className={cn(tag, "font-mono text-[10px]", PRIORITY_CLASS[p], extra)}
      variant="outline"
    >
      <span aria-hidden={p === "none"}>{t[p]}</span>
      {p === "none" ? <span className="sr-only">{t.noPriority}</span> : null}
    </Badge>
  );
  const statusIcon = (s: TrackerStatus) => {
    const Icon = STATUS[s].icon;
    return (
      <Icon
        aria-label={t[s]}
        className={cn("size-3.5 shrink-0", STATUS[s].className)}
        role="img"
      />
    );
  };

  const sortHead = (
    id: "priority" | "updatedAt",
    label: string,
    cellClass?: string
  ) => {
    const active = query.sort?.id === id ? query.sort.direction : undefined;
    return (
      <TableHead
        aria-sort={
          active === "asc"
            ? "ascending"
            : active === "desc"
              ? "descending"
              : "none"
        }
        className={cellClass}
      >
        <button
          className="-mx-1 inline-flex items-center gap-1 rounded-sm px-1 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onQueryChange(toggleSort(query, id))}
          type="button"
        >
          {label}
          {active === "asc" ? (
            <ArrowUpIcon className="size-3" />
          ) : active === "desc" ? (
            <ArrowDownIcon className="size-3" />
          ) : null}
        </button>
      </TableHead>
    );
  };

  const message = (title: string, description?: string, action?: ReactNode) => (
    <TableRow>
      <TableCell className="whitespace-normal py-12 text-center" colSpan={6}>
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="mt-1 text-muted-foreground text-sm">{description}</p>
        ) : null}
        {action}
      </TableCell>
    </TableRow>
  );

  let body: ReactNode;
  if (status === "loading") {
    body = SKELETON_ROWS.map((key) => (
      <TableRow key={key}>
        <TableCell className="ps-4" colSpan={6}>
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-16 motion-reduce:animate-none" />
            <Skeleton className="h-3.5 w-72 motion-reduce:animate-none" />
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
      ) : null
    );
  } else if (items.length === 0) {
    body = filtered
      ? message(
          t.noMatchTitle,
          t.noMatchDescription,
          <Button
            className="mt-4"
            onClick={() =>
              onQueryChange({
                ...query,
                search: undefined,
                filters: undefined,
                page: 1,
              })
            }
            size="sm"
            variant="outline"
          >
            {t.clearFilters}
          </Button>
        )
      : message(t.emptyTitle, t.emptyDescription);
  } else {
    body = items.map((issue) => {
      const assignee = issue.assigneeId
        ? personById.get(issue.assigneeId)
        : undefined;
      return (
        <TableRow key={issue.id}>
          <TableCell className="ps-4 max-md:hidden">
            <span className="inline-flex items-center gap-2 font-mono text-muted-foreground text-xs">
              {statusIcon(issue.status)}
              {issue.key}
            </span>
          </TableCell>
          <TableCell className="w-full max-w-0 max-md:whitespace-normal max-md:ps-4">
            <div className="mb-0.5 flex items-center gap-2 font-mono text-muted-foreground text-xs md:hidden">
              {statusIcon(issue.status)}
              {issue.key}
              {priorityBadge(issue.priority, "sm:hidden")}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 md:flex-nowrap">
              {issueHref ? (
                <WirefrontLink
                  className="line-clamp-2 rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring md:truncate"
                  href={issueHref(issue)}
                >
                  {issue.title}
                </WirefrontLink>
              ) : (
                <span className="line-clamp-2 font-medium md:truncate">
                  {issue.title}
                </span>
              )}
              {issue.labelIds.map((id) => {
                const meta = labelById.get(id);
                return meta ? (
                  <Badge
                    className={cn(
                      tag,
                      "shrink-0 text-[10px]",
                      LABEL_CLASS[meta.color]
                    )}
                    key={id}
                    variant="outline"
                  >
                    {meta.name}
                  </Badge>
                ) : null;
              })}
            </div>
          </TableCell>
          <TableCell className="max-sm:hidden">
            {priorityBadge(issue.priority)}
          </TableCell>
          <TableCell className="max-lg:hidden">
            {issue.estimate !== null ? (
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted font-mono text-[10px] tabular-nums">
                <span aria-hidden>{issue.estimate}</span>
                <span className="sr-only">
                  {interpolate(t.points, { count: issue.estimate })}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">{t.noEstimate}</span>
            )}
          </TableCell>
          <TableCell className="max-sm:pe-4">
            {assignee ? (
              <Avatar
                className={cn("size-6", assignee.tint)}
                title={assignee.name}
              >
                <AvatarFallback className="bg-transparent font-medium text-[10px]">
                  <span aria-hidden>{initialsOf(assignee.name)}</span>
                  <span className="sr-only">{assignee.name}</span>
                </AvatarFallback>
              </Avatar>
            ) : (
              <div
                aria-label={t.unassigned}
                className="size-6 rounded-full border border-dashed"
                role="img"
              />
            )}
          </TableCell>
          <TableCell className="pe-4 text-end text-muted-foreground text-xs tabular-nums max-md:hidden">
            {format.relative(issue.updatedAt)}
          </TableCell>
        </TableRow>
      );
    });
  }

  return (
    <div
      className={cn(
        "min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-12",
        className
      )}
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <h1 className="font-heading text-xl">{t.title}</h1>
            <p className="text-muted-foreground text-sm">
              {subtitle ? <>{subtitle} · </> : null}
              {status === "ready"
                ? total === 1
                  ? t.countOne
                  : interpolate(t.countOther, { count: format.number(total) })
                : null}
            </p>
          </div>
          {newIssueHref ? (
            <WirefrontLink
              className={cn(
                buttonVariants({ size: "sm" }),
                "pointer-coarse:h-10"
              )}
              href={newIssueHref}
            >
              <PlusIcon />
              {t.newIssue}
            </WirefrontLink>
          ) : null}
        </header>

        <div className="rounded-xl border bg-card shadow-xs/5">
          <div className="flex flex-wrap items-center gap-2 border-b p-3">
            <InputGroup className="w-full sm:w-64">
              <InputGroupAddon>
                <SearchIcon
                  aria-hidden
                  className="size-4 text-muted-foreground"
                />
              </InputGroupAddon>
              <InputGroupInput
                aria-label={t.search}
                onChange={(e) =>
                  onQueryChange(withSearch(query, e.target.value))
                }
                placeholder={t.searchPlaceholder}
                type="search"
                value={query.search ?? ""}
              />
            </InputGroup>
            <Separator
              className="mx-1 h-6 max-sm:hidden"
              orientation="vertical"
            />
            <Facet
              label={t.status}
              onChange={setFacet("status")}
              options={STATUSES.map((s) => ({
                value: s,
                label: t[s],
                content: (
                  <>
                    {statusIcon(s)}
                    <span className="flex-1">{t[s]}</span>
                  </>
                ),
              }))}
              selected={selected("status")}
            />
            <Facet
              label={t.priority}
              onChange={setFacet("priority")}
              options={PRIORITIES.map((p) => ({
                value: p,
                label: priorityLabel(p),
                content: priorityBadge(p),
              }))}
              selected={selected("priority")}
            />
            <Facet
              icon={<UserIcon className="size-3.5" />}
              label={t.assignee}
              onChange={setFacet("assignee")}
              options={people.map((p) => ({
                value: p.id,
                label: p.name,
                content: (
                  <>
                    <Avatar className="size-5">
                      <AvatarFallback className="bg-muted font-medium text-[9px]">
                        {initialsOf(p.name)}
                      </AvatarFallback>
                    </Avatar>
                    {p.name}
                  </>
                ),
              }))}
              selected={selected("assignee")}
            />
            <Facet
              icon={<TagIcon className="size-3.5" />}
              label={t.label}
              onChange={setFacet("label")}
              options={labels.map((l) => ({
                value: l.id,
                label: l.name,
                content: (
                  <Badge
                    className={cn(tag, "text-[10px]", LABEL_CLASS[l.color])}
                    variant="outline"
                  >
                    {l.name}
                  </Badge>
                ),
              }))}
              selected={selected("label")}
            />
            {onAddFilter ? (
              <Button
                className="border-dashed"
                onClick={onAddFilter}
                size="sm"
                variant="ghost"
              >
                <PlusCircleIcon />
                <span className="text-muted-foreground">{t.addFilter}</span>
              </Button>
            ) : null}
            {activeCount ? (
              <span className="ms-auto text-muted-foreground text-xs">
                <span className="text-foreground">
                  {activeCount === 1
                    ? t.activeOne
                    : interpolate(t.activeOther, { count: activeCount })}
                </span>{" "}
                {t.active}
              </span>
            ) : null}
          </div>

          {/*
            Priority columns: phones see Title (status, ID and priority folded
            in) and Assignee; Priority returns at sm, ID and Updated at md,
            Estimate at lg.
          */}
          <Table aria-busy={status === "loading"}>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24 ps-4 max-md:hidden">
                  {t.columnId}
                </TableHead>
                <TableHead className="max-md:ps-4">{t.columnTitle}</TableHead>
                {sortHead("priority", t.columnPriority, "w-32 max-sm:hidden")}
                <TableHead className="w-24 max-lg:hidden">
                  {t.columnEstimate}
                </TableHead>
                <TableHead className="w-24 max-sm:w-px max-sm:pe-4">
                  <span className="max-sm:sr-only">{t.columnAssignee}</span>
                </TableHead>
                {sortHead(
                  "updatedAt",
                  t.columnUpdated,
                  "w-28 pe-4 text-end max-md:hidden"
                )}
              </TableRow>
            </TableHeader>
            <TableBody>{body}</TableBody>
          </Table>
        </div>

        {status === "ready" && pages > 1 ? (
          <nav
            aria-label={t.pagination}
            className="mt-3 flex items-center justify-end gap-2 text-muted-foreground text-sm"
          >
            <span className="tabular-nums">
              {interpolate(t.range, { from, to, total })}
            </span>
            <Button
              aria-label={t.previous}
              disabled={query.page <= 1}
              onClick={() =>
                onQueryChange(withPage(query, query.page - 1, total))
              }
              size="icon-sm"
              variant="outline"
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              aria-label={t.next}
              disabled={query.page >= pages}
              onClick={() =>
                onQueryChange(withPage(query, query.page + 1, total))
              }
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

export function IssuesTable(props: IssuesTableProps) {
  return (
    <ScreenBoundary name="IssuesTable">
      <IssuesTableScreen {...props} />
    </ScreenBoundary>
  );
}
