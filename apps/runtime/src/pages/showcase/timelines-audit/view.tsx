// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
} from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import {
  ActivityIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  KeyIcon,
  ShieldIcon,
  Trash2Icon,
  UserCogIcon,
  UserPlusIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AuditEvent, AuditLog } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("auditTrail.<key>"). */
export const AUDIT_TRAIL_MESSAGES = {
  eyebrow: "Security · Audit log",
  title: "Audit trail",
  summary: "Last 30 days · {count} events",
  diff: "diff",
  before: "Before",
  after: "After",
  severity: "{severity} severity,",
  info: "info",
  warn: "warning",
  danger: "high",
  from: "· from {ip}",
  view: "view",
  viewEvent: "View event: {actor} {action} {target}",
  empty: "No audit events in this period.",
  errorTitle: "Couldn’t load the audit log",
  retry: "Try again",
};

export interface AuditTrailProps {
  /** The events, newest first. Leave it out while they load. */
  data?: AuditLog;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Shown after the summary, e.g. how long the log is kept. */
  note?: string;
  /** Open an event's details. The view buttons are hidden without it. */
  onViewEvent?: (id: string) => void;
  className?: string;
}

const ICONS: Record<AuditEvent["kind"], ReactNode> = {
  key: <KeyIcon className="size-3.5" />,
  delete: <Trash2Icon className="size-3.5" />,
  role: <UserCogIcon className="size-3.5" />,
  security: <ShieldIcon className="size-3.5" />,
  invite: <UserPlusIcon className="size-3.5" />,
  other: <ActivityIcon className="size-3.5" />,
};
const SEV_RING: Record<AuditEvent["severity"], string> = {
  info: "bg-foreground/6 text-foreground",
  warn: "bg-warning/15 text-warning-foreground",
  danger: "bg-destructive/15 text-destructive-foreground",
};
const SEV_DOT: Record<AuditEvent["severity"], string> = {
  info: "bg-foreground/40",
  warn: "bg-warning",
  danger: "bg-destructive",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function AuditTrailScreen({
  data,
  status = "ready",
  error,
  onRetry,
  note,
  onViewEvent,
  className,
}: AuditTrailProps) {
  const t = useMessages("auditTrail", AUDIT_TRAIL_MESSAGES);
  const fmt = useFormat();
  const events = data?.events ?? [];

  return (
    <div
      className={cn(
        "min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10",
        className
      )}
    >
      <div className="mx-auto max-w-3xl">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          {t.eyebrow}
        </div>
        <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
        {data ? (
          <p className="mt-1 text-muted-foreground text-sm">
            {interpolate(t.summary, {
              count: fmt.number(data.total ?? events.length),
            })}
            {note ? ` · ${note}` : ""}
          </p>
        ) : null}

        <div className="mt-6 rounded-xl border border-border/60 bg-background/40 px-3 py-3 sm:px-5">
          {status === "error" ? (
            <div className="py-12 text-center">
              <p className="font-medium">{t.errorTitle}</p>
              {error ? (
                <p className="mt-1 text-muted-foreground text-sm">{error}</p>
              ) : null}
              {onRetry ? (
                <Button
                  className="mt-4"
                  onClick={onRetry}
                  size="sm"
                  variant="outline"
                >
                  {t.retry}
                </Button>
              ) : null}
            </div>
          ) : !data || status === "loading" ? (
            <div aria-busy="true" className="flex flex-col gap-4 py-3">
              {["a", "b", "c", "d"].map((k) => (
                <Skeleton
                  className="h-12 w-full motion-reduce:animate-none"
                  key={k}
                />
              ))}
            </div>
          ) : events.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground text-sm">
              {t.empty}
            </p>
          ) : (
            <ol className="relative">
              <span
                aria-hidden
                className="absolute inset-s-4.25 top-2 bottom-2 w-px bg-border/50"
              />
              {events.map((e) => (
                <li
                  className={cn(
                    "relative grid items-start gap-3 py-3",
                    onViewEvent
                      ? "grid-cols-[34px_minmax(0,1fr)_auto]"
                      : "grid-cols-[34px_minmax(0,1fr)]"
                  )}
                  key={e.id}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "z-10 grid size-8.5 place-items-center rounded-full ring-4 ring-background",
                      SEV_RING[e.severity]
                    )}
                  >
                    {ICONS[e.kind]}
                  </span>
                  <div className="min-w-0 pt-1.5">
                    {/* Wraps instead of truncating, so the action's target stays readable on phones. */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                      <Avatar aria-hidden className="size-5 shrink-0">
                        <AvatarFallback className="text-[10px]">
                          {initials(e.actor)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{e.actor}</span>
                      <span className="text-muted-foreground">{e.action}</span>
                      {e.target ? (
                        <span className="min-w-0 wrap-break-word text-foreground/85">
                          {e.target}
                        </span>
                      ) : null}
                    </div>
                    {e.diff ? (
                      <details className="group mt-2">
                        <summary className="inline-flex min-h-6 cursor-pointer list-none items-center gap-1 rounded bg-foreground/4 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] hover:bg-foreground/6">
                          <ChevronDownIcon
                            aria-hidden
                            className="size-3 -rotate-90 transition-transform group-open:rotate-0"
                          />
                          {t.diff}
                        </summary>
                        <div className="mt-2 overflow-hidden rounded-md border border-border/60 font-mono text-[11px] [&>div]:break-all">
                          <div className="border-category-4/20 border-b bg-category-4/6 px-2 py-1 text-category-4-foreground">
                            <span className="sr-only">{t.before}</span>
                            <span aria-hidden>- </span>
                            {e.diff.before}
                          </div>
                          <div className="bg-category-2/6 px-2 py-1 text-category-2-foreground">
                            <span className="sr-only">{t.after}</span>
                            <span aria-hidden>+ </span>
                            {e.diff.after}
                          </div>
                        </div>
                      </details>
                    ) : null}
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-[10px] text-muted-foreground">
                      <span
                        aria-hidden
                        className={cn(
                          "size-1 rounded-full",
                          SEV_DOT[e.severity]
                        )}
                      />
                      <span className="sr-only">
                        {interpolate(t.severity, { severity: t[e.severity] })}
                      </span>
                      <time dateTime={e.at}>{fmt.relative(e.at)}</time>
                      {e.ip ? (
                        <span>{interpolate(t.from, { ip: e.ip })}</span>
                      ) : null}
                    </div>
                  </div>
                  {onViewEvent ? (
                    // Text label on wider screens, a chevron with a 40px hit area on phones.
                    <button
                      className="-me-2 grid min-h-10 min-w-10 place-items-center self-center rounded-md font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] outline-none hover:bg-foreground/4 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:me-0 sm:min-h-8 sm:px-2"
                      onClick={() => onViewEvent(e.id)}
                      type="button"
                    >
                      <span className="sr-only">
                        {interpolate(t.viewEvent, {
                          actor: e.actor,
                          action: e.action,
                          target: e.target ?? "",
                        }).trim()}
                      </span>
                      <span aria-hidden className="max-sm:hidden">
                        {t.view}
                      </span>
                      <ChevronRightIcon
                        aria-hidden
                        className="size-4 sm:hidden"
                      />
                    </button>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

export function AuditTrail(props: AuditTrailProps) {
  return (
    <ScreenBoundary name="AuditTrail">
      <AuditTrailScreen {...props} />
    </ScreenBoundary>
  );
}
