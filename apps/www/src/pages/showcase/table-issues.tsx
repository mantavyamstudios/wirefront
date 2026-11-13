// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { cn } from "@wirefront/ui/lib/utils";
import {
  CheckIcon,
  CircleDashedIcon,
  CircleDotIcon,
  CircleIcon,
  PlusCircleIcon,
  SearchIcon,
  TagIcon,
  UserIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
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
import { Popover, PopoverContent, PopoverTrigger } from "@wirefront/ui/popover";
import { Separator } from "@wirefront/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@wirefront/ui/table";

type Status = "todo" | "in-progress" | "in-review" | "done";
type Priority = "p0" | "p1" | "p2" | "p3" | "none";

interface Issue {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
  assignee: { initials: string; tone: string } | null;
  labels: string[];
  updated: string;
  estimate?: number;
}

const STATUS_META: Record<Status, { label: string; icon: typeof CheckIcon; cls: string }> = {
  todo: { label: "Todo", icon: CircleIcon, cls: "text-muted-foreground" },
  "in-progress": { label: "In Progress", icon: CircleDotIcon, cls: "text-category-3-foreground" },
  "in-review": { label: "In Review", icon: CircleDashedIcon, cls: "text-category-5-foreground" },
  done: { label: "Done", icon: CheckIcon, cls: "text-success-foreground" },
};

const PRIORITY_META: Record<Priority, { label: string; cls: string }> = {
  p0: { label: "Urgent", cls: "border-destructive/30 text-destructive-foreground" },
  p1: { label: "High", cls: "border-category-3/30 text-category-3-foreground" },
  p2: { label: "Med", cls: "border-category-1/30 text-category-1-foreground" },
  p3: { label: "Low", cls: "border-border text-muted-foreground" },
  none: { label: "—", cls: "border-dashed text-muted-foreground" },
};

const LABEL_TONE: Record<string, string> = {
  bug: "bg-category-4/10 text-category-4-foreground border-category-4/20",
  feature: "bg-category-5/10 text-category-5-foreground border-category-5/20",
  infra: "bg-category-3/10 text-category-3-foreground border-category-3/20",
  docs: "bg-category-1/10 text-category-1-foreground border-category-1/20",
  design: "bg-category-4/10 text-category-4-foreground border-category-4/20",
  perf: "bg-category-2/10 text-category-2-foreground border-category-2/20",
};

const ISSUES: Issue[] = [
  { id: "ENG-218", title: "Realtime cursors flicker on Safari 17 after WS reconnect", status: "in-progress", priority: "p0", assignee: { initials: "AL", tone: "bg-category-4/15" }, labels: ["bug", "perf"], updated: "12m", estimate: 5 },
  { id: "ENG-217", title: "Add cycle progress chart to project sidebar", status: "in-review", priority: "p2", assignee: { initials: "GH", tone: "bg-category-3/15" }, labels: ["feature", "design"], updated: "2h", estimate: 3 },
  { id: "ENG-216", title: "Migrate billing webhook to v2 schema", status: "todo", priority: "p1", assignee: { initials: "AT", tone: "bg-category-1/15" }, labels: ["infra"], updated: "Yesterday", estimate: 8 },
  { id: "ENG-215", title: "Filter chips: persist operator across pages", status: "todo", priority: "p3", assignee: null, labels: ["bug"], updated: "Apr 22", estimate: 2 },
  { id: "ENG-214", title: "Document new `useFilters()` hook + ergonomics", status: "in-progress", priority: "p2", assignee: { initials: "LT", tone: "bg-category-2/15" }, labels: ["docs"], updated: "Apr 22" },
  { id: "ENG-213", title: "Reduce p99 latency on `/v1/search` ≤ 180ms", status: "in-review", priority: "p1", assignee: { initials: "MH", tone: "bg-category-5/15" }, labels: ["perf", "infra"], updated: "Apr 21", estimate: 13 },
  { id: "ENG-212", title: "Onboarding: reorder workspace steps", status: "done", priority: "p3", assignee: { initials: "ED", tone: "bg-category-8/15" }, labels: ["design"], updated: "Apr 19", estimate: 3 },
];

export function TableIssues() {
  return (
    <div className="min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <h1 className="font-heading text-xl">Issues</h1>
            <p className="text-muted-foreground text-sm">
              ENG · Cycle 14 · 7 visible of 218
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" className="pointer-coarse:h-10">Group: None</Button>
            <Button size="sm" className="pointer-coarse:h-10">+ New issue</Button>
          </div>
        </header>

        <div className="rounded-xl border bg-card shadow-xs/5">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2 border-b p-3">
            <InputGroup className="w-full sm:w-64">
              <InputGroupAddon>
                <SearchIcon className="size-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput placeholder="Search issues…" aria-label="Search issues" />
            </InputGroup>

            <Separator orientation="vertical" className="mx-1 h-6 max-sm:hidden" />

            <FacetButton label="Status" count={2} chips={["Todo", "In Progress"]}>
              <FacetSearch />
              <Separator />
              <CheckboxGroup
                aria-label="Status"
                defaultValue={["todo", "in-progress"]}
                className="flex flex-col p-1"
              >
                {(Object.keys(STATUS_META) as Status[]).map((s) => {
                  const m = STATUS_META[s];
                  const Icon = m.icon;
                  return (
                    <Label
                      key={s}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                    >
                      <Checkbox value={s} />
                      <Icon className={"size-3.5 " + m.cls} />
                      <span className="flex-1">{m.label}</span>
                    </Label>
                  );
                })}
              </CheckboxGroup>
            </FacetButton>

            <FacetButton label="Priority" count={1} chips={["High"]}>
              <CheckboxGroup
                aria-label="Priority"
                defaultValue={["p1"]}
                className="flex flex-col p-1"
              >
                {(["p0", "p1", "p2", "p3"] as Priority[]).map((p) => (
                  <Label
                    key={p}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Checkbox value={p} />
                    <Badge variant="outline" className={cn("h-4.5 rounded-sm px-1 text-[0.625rem]", "font-mono text-[10px] " + PRIORITY_META[p].cls)}>
                      {PRIORITY_META[p].label}
                    </Badge>
                  </Label>
                ))}
              </CheckboxGroup>
            </FacetButton>

            <FacetButton label="Assignee" icon={<UserIcon className="size-3.5" />}>
              <FacetSearch />
              <Separator />
              <CheckboxGroup aria-label="Assignee" className="flex flex-col p-1">
                {[
                  { v: "ada", l: "Ada Lovelace", i: "AL" },
                  { v: "grace", l: "Grace Hopper", i: "GH" },
                  { v: "alan", l: "Alan Turing", i: "AT" },
                  { v: "linus", l: "Linus Torvalds", i: "LT" },
                ].map((a) => (
                  <Label
                    key={a.v}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Checkbox value={a.v} />
                    <Avatar className="size-5">
                      <AvatarFallback className="bg-muted font-medium text-[9px]">
                        {a.i}
                      </AvatarFallback>
                    </Avatar>
                    {a.l}
                  </Label>
                ))}
              </CheckboxGroup>
            </FacetButton>

            <FacetButton label="Label" icon={<TagIcon className="size-3.5" />}>
              <CheckboxGroup aria-label="Label" className="flex flex-col p-1">
                {Object.keys(LABEL_TONE).map((label) => (
                  <Label
                    key={label}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Checkbox value={label} />
                    <Badge variant="outline" className={cn("h-4.5 rounded-sm px-1 text-[0.625rem]", "text-[10px] " + LABEL_TONE[label])}>
                      {label}
                    </Badge>
                  </Label>
                ))}
              </CheckboxGroup>
            </FacetButton>

            <Button size="sm" variant="ghost" className="border-dashed">
              <PlusCircleIcon />
              <span className="text-muted-foreground">Add filter</span>
            </Button>

            <span className="ms-auto text-muted-foreground text-xs">
              <span className="text-foreground">3 filters</span> active
            </span>
          </div>

          {/*
            Priority columns: phones see select, Title (status, ID, labels and
            priority folded in) and Assignee; Priority returns at sm, ID and
            Updated at md, Estimate at lg.
          */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-4 w-px">
                  <Checkbox aria-label="Select all" />
                </TableHead>
                <TableHead className="w-24 max-md:hidden">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-32 max-sm:hidden">Priority</TableHead>
                <TableHead className="w-24 max-lg:hidden">Estimate</TableHead>
                <TableHead className="w-24 max-sm:w-px max-sm:pe-4">
                  <span className="max-sm:sr-only">Assignee</span>
                </TableHead>
                <TableHead className="pe-4 w-28 text-end max-md:hidden">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ISSUES.map((issue) => {
                const m = STATUS_META[issue.status];
                const Icon = m.icon;
                return (
                  <TableRow key={issue.id}>
                    <TableCell className="ps-4">
                      <label className="-m-2.5 flex cursor-pointer p-2.5 pointer-coarse:-m-3.5 pointer-coarse:p-3.5">
                        <Checkbox aria-label={`Select ${issue.id}`} />
                      </label>
                    </TableCell>
                    <TableCell className="max-md:hidden">
                      <span className="inline-flex items-center gap-2 font-mono text-muted-foreground text-xs">
                        <Icon className={"size-3.5 " + m.cls} />
                        {issue.id}
                      </span>
                    </TableCell>
                    <TableCell className="w-full max-w-0 max-md:whitespace-normal">
                      <div className="mb-0.5 flex items-center gap-2 font-mono text-muted-foreground text-xs md:hidden">
                        <Icon className={"size-3.5 " + m.cls} />
                        {issue.id}
                        <Badge
                          variant="outline"
                          className={cn("h-4.5 rounded-sm px-1 text-[0.625rem]", "font-mono text-[10px] sm:hidden " + PRIORITY_META[issue.priority].cls)}
                        >
                          {PRIORITY_META[issue.priority].label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 md:flex-nowrap">
                        <span className="line-clamp-2 font-medium md:truncate">{issue.title}</span>
                        {issue.labels.map((lbl) => (
                          <Badge
                            key={lbl}
                            variant="outline"
                            className={cn("h-4.5 rounded-sm px-1 text-[0.625rem]", "shrink-0 text-[10px] " + (LABEL_TONE[lbl] ?? ""))}
                          >
                            {lbl}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-sm:hidden">
                      <Badge
                        variant="outline"
                        className={cn("h-4.5 rounded-sm px-1 text-[0.625rem]", "font-mono text-[10px] " + PRIORITY_META[issue.priority].cls)}
                      >
                        {PRIORITY_META[issue.priority].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-lg:hidden">
                      {issue.estimate ? (
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted font-mono text-[10px] tabular-nums">
                          {issue.estimate}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-sm:pe-4">
                      {issue.assignee ? (
                        <Avatar className={"size-6 " + issue.assignee.tone}>
                          <AvatarFallback className="bg-transparent font-medium text-[10px]">
                            {issue.assignee.initials}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div
                          className="size-6 rounded-full border border-dashed"
                          aria-label="Unassigned"
                          role="img"
                        />
                      )}
                    </TableCell>
                    <TableCell className="pe-4 text-end text-muted-foreground text-xs tabular-nums max-md:hidden">
                      {issue.updated}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function FacetButton({
  label,
  icon,
  count,
  chips,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  count?: number;
  chips?: string[];
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            className={
              count
                ? "border-foreground/20 bg-foreground/5"
                : "border-dashed"
            }
          >
            {icon ?? <PlusCircleIcon />}
            {label}
            {count ? (
              <>
                <Separator orientation="vertical" className="mx-1 h-3" />
                {chips && chips.length <= 2 ? (
                  chips.map((c) => (
                    <Badge
                      key={c}
                      variant="secondary"
                      className="h-4.5 rounded-sm px-1 text-[0.625rem] font-mono text-[10px]"
                    >
                      {c}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="secondary" className="h-4.5 rounded-sm px-1 text-[0.625rem] font-mono text-[10px]">
                    {count}
                  </Badge>
                )}
              </>
            ) : null}
          </Button>
        }
      />
      <PopoverContent className="w-60 p-0">{children}</PopoverContent>
    </Popover>
  );
}

function FacetSearch() {
  return (
    <div className="p-2">
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon className="size-3.5 text-muted-foreground" />
        </InputGroupAddon>
        <InputGroupInput placeholder="Filter…" className="h-8 text-sm" />
      </InputGroup>
    </div>
  );
}
