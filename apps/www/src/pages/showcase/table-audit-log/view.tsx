// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Separator } from "@wirefront/ui/separator";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@wirefront/ui/table";
import { useAction } from "@wirefront/ui/wirefront/action";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { ChevronDownIcon, CircleAlertIcon, CircleCheckIcon, CircleSlashIcon, PlusIcon, ShieldIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";

import type { AuditEntry, AuditFilter, Outcome } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("auditLog.<key>"). */
export const AUDIT_LOG_MESSAGES = {
  title: "Audit log",
  summary: "Security events · {shown} of {total}",
  export: "Export to SIEM",
  filters: "Filters",
  addFilter: "Add",
  clearAll: "Clear all",
  editFilter: "Edit {field} filter value: {value}",
  removeFilter: "Remove {field} filter",
  columnTime: "Time",
  columnEvent: "Event",
  columnActor: "Actor",
  columnAction: "Action",
  columnResource: "Resource",
  columnWhere: "IP / Location",
  columnOutcome: "Outcome",
  system: "System",
  success: "Allowed",
  denied: "Denied",
  alert: "Suspicious",
  filterCountOne: "1 filter",
  filterCountOther: "{count} filters",
  loadOlder: "Load older →",
  emptyTitle: "No events match",
  emptyDescription: "Try widening the time range or removing a filter.",
  errorTitle: "Couldn’t load the audit log",
  retry: "Try again",
};

export interface AuditLogProps {
  /** Entries loaded so far, newest first. */
  entries: AuditEntry[];
  /** Matching entries in total. */
  total: number;
  /** Load the next older page and append it to `entries`. "Load older" only shows when given and `hasMore`. */
  onLoadMore?: Action;
  hasMore?: boolean;
  /** Active filters, shown as chips. */
  filters: AuditFilter[];
  onRemoveFilter?: (id: string) => void;
  onClearFilters?: () => void;
  /** Open your filter editor for a chip (receives its id). Values are plain text when not given. */
  onEditFilter?: (id: string) => void;
  /** Open your filter picker. The Add button only shows when given. */
  onAddFilter?: () => void;
  /** Send the matching events to your SIEM. The Export button only shows when given. */
  onExport?: Action;
  /** "loading" shows skeleton rows; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

const OUTCOME: Record<Outcome, { cls: string; Icon: typeof CircleCheckIcon }> = {
  success: { cls: "border-emerald-500/30 text-emerald-700 dark:text-emerald-400", Icon: CircleCheckIcon },
  denied: { cls: "border-amber-500/30 text-amber-700 dark:text-amber-400", Icon: CircleSlashIcon },
  alert: { cls: "border-destructive/30 text-destructive-foreground", Icon: CircleAlertIcon },
};
const CHIP_TONE: Record<AuditFilter["tone"], { chip: string; op: string }> = {
  include: { chip: "border-emerald-500/30 bg-emerald-500/5", op: "text-emerald-700 dark:text-emerald-400" },
  exclude: { chip: "border-destructive/30 bg-destructive/5", op: "text-destructive-foreground" },
  neutral: { chip: "border-border bg-background", op: "text-muted-foreground" },
};
const SKELETON_ROWS = ["s1", "s2", "s3", "s4", "s5"];

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function AuditLogScreen({
  entries,
  total,
  onLoadMore,
  hasMore,
  filters,
  onRemoveFilter,
  onClearFilters,
  onEditFilter,
  onAddFilter,
  onExport,
  status = "ready",
  error,
  onRetry,
  className,
}: AuditLogProps) {
  const t = useMessages("auditLog", AUDIT_LOG_MESSAGES);
  const format = useFormat();
  const more = useAction(onLoadMore ?? (async () => {}));
  const exporter = useAction(onExport ?? (async () => {}));
  const time = (iso: string) => format.time(iso, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const actionError = more.error ?? exporter.error;

  const message = (title: string, description?: string, action?: ReactNode) => (
    <TableRow>
      <TableCell className="whitespace-normal py-12 text-center" colSpan={6}>
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
        <TableCell className="ps-4" colSpan={6}>
          <div className="flex items-center gap-3">
            <Skeleton className="size-6 rounded-full motion-reduce:animate-none" />
            <Skeleton className="h-3.5 w-64 motion-reduce:animate-none" />
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
  } else if (entries.length === 0) {
    body = message(t.emptyTitle, t.emptyDescription);
  } else {
    body = entries.map((e) => {
      const o = OUTCOME[e.outcome];
      const name = e.actor?.name ?? t.system;
      return (
        <TableRow className={e.outcome === "alert" ? "bg-destructive/[0.04]" : undefined} key={e.id}>
          <TableCell className="w-28 ps-4 font-mono text-muted-foreground text-xs tabular-nums max-sm:hidden">
            <time dateTime={e.at}>{time(e.at)}</time>
          </TableCell>
          <TableCell className="w-full max-w-0 max-sm:ps-4 sm:w-auto sm:max-w-none">
            <div className="flex items-center gap-2">
              <Avatar className={cn("size-6", e.actor ? "bg-sky-500/15" : "bg-muted")}>
                <AvatarFallback className="bg-transparent font-medium text-[10px]">{e.actor ? initials(e.actor.name) : "?"}</AvatarFallback>
              </Avatar>
              <span className={cn("truncate text-sm", !e.actor && "text-muted-foreground")}>{name}</span>
            </div>
            <div className="mt-1 truncate font-mono text-xs sm:hidden">{e.action}</div>
            <div className="truncate font-mono text-[11px] text-muted-foreground lg:hidden">
              <span className="sm:hidden">{time(e.at)} · </span>
              {e.resource}
            </div>
          </TableCell>
          <TableCell className="font-mono text-xs max-sm:hidden">{e.action}</TableCell>
          <TableCell className="font-mono text-muted-foreground text-xs max-lg:hidden">{e.resource}</TableCell>
          <TableCell className="max-xl:hidden">
            <div className="font-mono text-xs">{e.ip ?? "—"}</div>
            <div className="text-muted-foreground text-xs">{e.location ?? "—"}</div>
          </TableCell>
          <TableCell className="pe-4">
            <Badge className={cn("gap-1.5", o.cls)} variant="outline">
              <o.Icon className="size-3" />
              {t[e.outcome]}
            </Badge>
          </TableCell>
        </TableRow>
      );
    });
  }

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-12", className)}>
      <div className="mx-auto max-w-6xl">
        <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <h1 className="flex items-center gap-2 font-heading text-xl">
              <ShieldIcon className="size-5 text-muted-foreground" />
              {t.title}
            </h1>
            <p className="text-muted-foreground text-sm">
              {interpolate(t.summary, { shown: format.number(entries.length), total: format.number(total) })}
            </p>
          </div>
          {onExport ? (
            <Button
              aria-busy={exporter.isPending()}
              className="self-start pointer-coarse:h-10 sm:self-auto"
              disabled={exporter.isPending()}
              onClick={() => void exporter.run()}
              size="sm"
              variant="outline"
            >
              {exporter.isPending() ? <Spinner data-icon="inline-start" /> : null}
              {t.export}
            </Button>
          ) : null}
        </header>

        {actionError ? (
          <p className="mb-3 text-destructive-foreground text-sm" role="alert">
            {actionError}
          </p>
        ) : null}

        <div className="rounded-xl border bg-card shadow-xs/5">
          {filters.length || onAddFilter ? (
            <div className="flex flex-col gap-2 border-b p-3">
              <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{t.filters}</span>
                <Separator className="h-4 max-sm:hidden" orientation="vertical" />
                <div className="order-last flex w-full min-w-0 flex-wrap items-center gap-1.5 sm:order-none sm:w-auto sm:flex-1">
                  {filters.map((f) => (
                    <FilterChip chip={f} key={f.id} onEdit={onEditFilter} onRemove={onRemoveFilter} t={t} />
                  ))}
                  {onAddFilter ? (
                    <Button className="border-dashed" onClick={onAddFilter} size="xs" variant="ghost">
                      <PlusIcon />
                      {t.addFilter}
                    </Button>
                  ) : null}
                </div>
                {onClearFilters && filters.length ? (
                  <Button className="ms-auto text-muted-foreground pointer-coarse:h-9 sm:ms-0" onClick={onClearFilters} size="xs" variant="ghost">
                    <XIcon />
                    {t.clearAll}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          {/*
            Priority columns: phones see Event (actor, action, time folded in)
            and Outcome; Time and Action return at sm, Resource at lg,
            IP / Location at xl.
          */}
          <Table aria-busy={status === "loading"}>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28 ps-4 max-sm:hidden">{t.columnTime}</TableHead>
                <TableHead className="max-sm:ps-4">
                  <span className="sm:hidden">{t.columnEvent}</span>
                  <span className="max-sm:hidden">{t.columnActor}</span>
                </TableHead>
                <TableHead className="max-sm:hidden">{t.columnAction}</TableHead>
                <TableHead className="max-lg:hidden">{t.columnResource}</TableHead>
                <TableHead className="max-xl:hidden">{t.columnWhere}</TableHead>
                <TableHead className="pe-4">{t.columnOutcome}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{body}</TableBody>
          </Table>
          {status === "ready" ? (
            <div className="flex items-center justify-between border-t p-3 text-muted-foreground text-xs">
              <span>
                {filters.length === 1 ? t.filterCountOne : interpolate(t.filterCountOther, { count: filters.length })}
              </span>
              {onLoadMore && hasMore ? (
                <Button aria-busy={more.isPending()} className="pointer-coarse:h-9" disabled={more.isPending()} onClick={() => void more.run()} size="xs" variant="ghost">
                  {more.isPending() ? <Spinner data-icon="inline-start" /> : null}
                  {t.loadOlder}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  chip,
  onEdit,
  onRemove,
  t,
}: {
  chip: AuditFilter;
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
  t: typeof AUDIT_LOG_MESSAGES;
}) {
  const tone = CHIP_TONE[chip.tone];
  return (
    <div className={cn("inline-flex max-w-full items-center divide-x divide-border overflow-hidden rounded-md border text-xs", tone.chip)}>
      <span className="px-2 py-1 font-medium">{chip.field}</span>
      <span className={cn("px-2 py-1 font-mono text-[11px]", tone.op)}>{chip.op}</span>
      {onEdit ? (
        <button
          aria-label={interpolate(t.editFilter, { field: chip.field, value: chip.value })}
          className="flex min-h-6 items-center gap-1 px-2 py-1 hover:bg-accent/60 pointer-coarse:min-h-9"
          onClick={() => onEdit(chip.id)}
          type="button"
        >
          <span className="font-medium">{chip.value}</span>
          <ChevronDownIcon className="size-3 opacity-60" />
        </button>
      ) : (
        <span className="px-2 py-1 font-medium">{chip.value}</span>
      )}
      {onRemove ? (
        <button
          aria-label={interpolate(t.removeFilter, { field: chip.field })}
          className="flex min-h-6 min-w-6 items-center justify-center px-1.5 py-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive-foreground pointer-coarse:min-h-9 pointer-coarse:min-w-9"
          onClick={() => onRemove(chip.id)}
          type="button"
        >
          <XIcon className="size-3" />
        </button>
      ) : null}
    </div>
  );
}

export function AuditLog(props: AuditLogProps) {
  return (
    <ScreenBoundary name="AuditLog">
      <AuditLogScreen {...props} />
    </ScreenBoundary>
  );
}
