// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Badge } from "@wirefront/ui/badge";
import { Button, buttonVariants } from "@wirefront/ui/button";
import { useMediaQuery } from "@wirefront/ui/hooks/use-media-query";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@wirefront/ui/input-group";
import { Kbd } from "@wirefront/ui/kbd";
import { cn } from "@wirefront/ui/lib/utils";
import { Separator } from "@wirefront/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@wirefront/ui/sheet";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@wirefront/ui/table";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { CheckIcon, CircleAlertIcon, CopyIcon, ExternalLinkIcon, FlameIcon, InfoIcon, MailIcon, PauseIcon, PlayIcon, RotateCwIcon, TerminalIcon } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import type { LogEntry, LogSeverity } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("logsTable.<key>"). */
export const LOGS_TABLE_MESSAGES = {
  title: "Logs",
  live: "live",
  paused: "paused",
  pause: "Pause",
  resume: "Resume",
  filter: "Filter logs",
  filterPlaceholder: "severity:error service:billing",
  columnTime: "Time",
  columnLevel: "Lvl",
  columnService: "Service",
  columnRequest: "Request",
  columnMessage: "Message",
  columnDuration: "ms",
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error",
  noRequest: "—",
  openDetails: "{severity} at {time}: {message}. Open details",
  footer: "Showing the last {count} entries",
  footerSource: "Showing the last {count} entries · streaming from {source}",
  footerHint: "select a row for details",
  emptyTitle: "No log lines",
  emptyDescription: "Nothing matches this filter yet.",
  errorTitle: "Couldn’t load logs",
  retry: "Try again",
  message: "Message",
  identifiers: "Identifiers",
  request: "Request",
  trace: "Trace",
  service: "Service",
  region: "Region",
  context: "Context",
  timing: "Timing",
  timingTotal: "{ms}ms total",
  milliseconds: "{ms}ms",
  payload: "Payload",
  stack: "Stack",
  copy: "Copy",
  copied: "Copied",
  copyLabel: "Copy {label}",
  copiedLabel: "{label} copied",
  copyFailed: "Couldn’t copy. Select the text and copy it.",
  openTrace: "Open in tracing",
  retryRequest: "Retry request",
  notifyOncall: "Notify on-call",
  notified: "On-call notified.",
  retried: "Request retried.",
};

export interface LogsTableProps {
  /** The lines to show, oldest first. Append new lines as they stream in. */
  entries: LogEntry[];
  /** The filter text; send it to your API (listLogs `q`). */
  filter: string;
  onFilterChange: (filter: string) => void;
  /** Whether new lines are streaming in. The badge and Pause button hide without `onLiveChange`. */
  live?: boolean;
  onLiveChange?: (live: boolean) => void;
  /** Where the lines come from, e.g. "prod-eu-west-1". */
  source?: string;
  /** "loading" shows skeleton rows; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Link to the trace in your tracing tool. The link hides without it or without a trace id. */
  traceHref?: (entry: LogEntry) => string;
  /** Replay the request behind an error line (replayRequest). Hidden without it. */
  onRetryRequest?: Action<LogEntry>;
  /** Page whoever is on call about an error line (notifyOncall). Hidden without it. */
  onNotifyOncall?: Action<LogEntry>;
  className?: string;
}

const SEVERITY: Record<LogSeverity, { dot: string; label: string }> = {
  debug: { dot: "bg-muted-foreground/40", label: "text-muted-foreground" },
  info: { dot: "bg-info", label: "text-info-foreground" },
  warn: { dot: "bg-warning", label: "text-warning-foreground" },
  error: { dot: "bg-destructive", label: "text-destructive-foreground" },
};
const SKELETON_ROWS = ["s1", "s2", "s3", "s4", "s5", "s6"];
const tag = "h-4.5 rounded-sm px-1 text-[0.625rem]";
const codeBlock = "rounded-md border border-border/60 bg-foreground/[0.03] p-3 font-mono leading-relaxed text-foreground/90";

/** Copy to the clipboard and say whether it worked. */
function useCopy() {
  const [state, setState] = useState<{ key: string; ok: boolean }>();
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setState({ key, ok: true });
    } catch {
      setState({ key, ok: false });
    }
  };
  return { copy, copied: (key: string) => state?.key === key && state.ok, failed: state?.ok === false };
}

function Section({ title, hint, action, children }: { title: string; hint?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="px-6">
      <header className="mb-2 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h3 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{title}</h3>
          {hint ? <span className="font-mono text-[10px] text-muted-foreground">{hint}</span> : null}
        </div>
        {action}
      </header>
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

function Details({
  entry,
  traceHref,
  onRetryRequest,
  onNotifyOncall,
}: {
  entry: LogEntry;
  traceHref?: (entry: LogEntry) => string;
  onRetryRequest?: Action<LogEntry>;
  onNotifyOncall?: Action<LogEntry>;
}) {
  const t = useMessages("logsTable", LOGS_TABLE_MESSAGES);
  const format = useFormat();
  const clip = useCopy();
  const [done, setDone] = useState<string>();
  const retry = useAction(onRetryRequest ?? (async () => {}), { onSuccess: () => setDone(t.retried) });
  const notify = useAction(onNotifyOncall ?? (async () => {}), { onSuccess: () => setDone(t.notified) });
  const timingTotal = entry.timing?.reduce((n, part) => n + part.ms, 0) ?? 0;

  const copyButton = (key: string, text: string) => (
    <button
      className="inline-flex min-h-6 items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] transition-colors hover:bg-foreground/[0.05] hover:text-foreground pointer-coarse:min-h-9"
      onClick={() => void clip.copy(key, text)}
      type="button"
    >
      {clip.copied(key) ? <CheckIcon aria-hidden className="size-3" /> : <CopyIcon aria-hidden className="size-3" />}
      {clip.copied(key) ? t.copied : t.copy}
    </button>
  );

  const keyVal = (label: string, value: string, copyable?: boolean) => (
    <div className="group flex items-baseline justify-between gap-3 rounded-md px-2 py-1 transition-colors focus-within:bg-foreground/[0.03] hover:bg-foreground/[0.03]" key={label}>
      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className="min-w-0 max-w-[55vw] truncate font-mono text-[12px] text-foreground/90 sm:max-w-[260px]">{value}</span>
        {copyable ? (
          <button
            aria-label={interpolate(clip.copied(label) ? t.copiedLabel : t.copyLabel, { label })}
            // Hover reveal on desktop; always visible on touch and when focused.
            className="inline-flex size-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-foreground/[0.05] hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 pointer-coarse:size-9 pointer-coarse:opacity-100"
            onClick={() => void clip.copy(label, value)}
            type="button"
          >
            {clip.copied(label) ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
          </button>
        ) : null}
      </span>
    </div>
  );

  const isError = entry.severity === "error";
  const failure = retry.error ?? notify.error;
  const trace = entry.traceId && traceHref ? traceHref(entry) : undefined;

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2 font-mono text-base">
          <span aria-hidden className={cn("size-1.5 rounded-full", SEVERITY[entry.severity].dot)} />
          <span className={cn("text-[10px] uppercase tracking-wider", SEVERITY[entry.severity].label)}>{t[entry.severity]}</span>
          <span className="text-foreground">{entry.requestId ?? entry.service}</span>
          {entry.status ? (
            <Badge className={cn(tag, "font-mono text-[9px]", entry.status >= 400 && "border-destructive/30 text-destructive-foreground")} variant="outline">
              {entry.status}
            </Badge>
          ) : null}
        </SheetTitle>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          {[entry.at, [entry.service, entry.serviceVersion].filter(Boolean).join(" "), entry.region].filter(Boolean).join(" · ")}
        </p>
      </SheetHeader>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto pb-6">
        <div aria-live="polite" className="px-6 empty:hidden">
          {clip.failed ? (
            <p className="text-destructive-foreground text-xs" role="alert">
              {t.copyFailed}
            </p>
          ) : null}
        </div>
        <Section action={copyButton("message", entry.message)} title={t.message}>
          <pre className={cn(codeBlock, "whitespace-pre-wrap text-[12px]")}>{entry.message}</pre>
        </Section>
        <Section title={t.identifiers}>
          {entry.requestId ? keyVal(t.request, entry.requestId, true) : null}
          {entry.traceId ? keyVal(t.trace, entry.traceId, true) : null}
          {keyVal(t.service, [entry.service, entry.serviceVersion].filter(Boolean).join(" · "))}
          {entry.region ? keyVal(t.region, entry.region) : null}
        </Section>
        {entry.context.length ? <Section title={t.context}>{entry.context.map((c) => keyVal(c.label, c.value))}</Section> : null}
        {entry.timing?.length ? (
          <Section hint={interpolate(t.timingTotal, { ms: format.number(entry.durationMs ?? timingTotal) })} title={t.timing}>
            <ul className="flex flex-col gap-2">
              {entry.timing.map((part) => (
                <li key={part.label}>
                  <div className="flex items-baseline justify-between font-mono text-[11px]">
                    <span className="text-muted-foreground">{part.label}</span>
                    <span className="tabular-nums">{interpolate(t.milliseconds, { ms: format.number(part.ms) })}</span>
                  </div>
                  <div aria-hidden className="mt-1 h-1 overflow-hidden rounded-full bg-foreground/[0.06]">
                    <div className="h-full rounded-full bg-foreground/70" style={{ width: `${timingTotal ? (part.ms / timingTotal) * 100 : 0}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
        {entry.payload ? (
          <Section action={copyButton("payload", entry.payload.body)} title={t.payload}>
            <pre className={cn(codeBlock, "overflow-x-auto text-[11px]")}>{entry.payload.body}</pre>
          </Section>
        ) : null}
        {entry.stack?.length ? (
          <Section title={t.stack}>
            <pre className={cn(codeBlock, "overflow-x-auto text-[11px]")}>
              {entry.stack.map((line, i) => `${String(i + 1).padStart(2)}  ${line}`).join("\n")}
            </pre>
          </Section>
        ) : null}
        {trace || (isError && (onRetryRequest || onNotifyOncall)) ? (
          <div className="px-6">
            <Separator className="mb-4" />
            <div className="flex flex-wrap items-center gap-2">
              {trace ? (
                <WirefrontLink className={buttonVariants({ size: "sm", variant: "outline" })} href={trace} rel="noreferrer" target="_blank">
                  <ExternalLinkIcon />
                  {t.openTrace}
                </WirefrontLink>
              ) : null}
              {isError && onRetryRequest ? (
                <Button aria-busy={retry.isPending()} disabled={retry.isPending()} onClick={() => void retry.run(entry)} size="sm" type="button" variant="outline">
                  {retry.isPending() ? <Spinner data-icon="inline-start" /> : <RotateCwIcon />}
                  {t.retryRequest}
                </Button>
              ) : null}
              {isError && onNotifyOncall ? (
                <Button aria-busy={notify.isPending()} disabled={notify.isPending()} onClick={() => void notify.run(entry)} size="sm" type="button" variant="outline">
                  {notify.isPending() ? <Spinner data-icon="inline-start" /> : <MailIcon />}
                  {t.notifyOncall}
                </Button>
              ) : null}
            </div>
            <div aria-live="polite" className="mt-2 text-xs">
              {failure ? (
                <p className="text-destructive-foreground" role="alert">
                  {failure}
                </p>
              ) : done ? (
                <p className="text-muted-foreground">{done}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

function LogsTableScreen({
  entries,
  filter,
  onFilterChange,
  live,
  onLiveChange,
  source,
  status = "ready",
  error,
  onRetry,
  traceHref,
  onRetryRequest,
  onNotifyOncall,
  className,
}: LogsTableProps) {
  const t = useMessages("logsTable", LOGS_TABLE_MESSAGES);
  const format = useFormat();
  const [selectedId, setSelectedId] = useState<string>();
  const selected = entries.find((e) => e.id === selectedId);
  // Bottom sheet on phones (thumb reach, full width), side panel from sm up.
  const isPhone = useMediaQuery("max-sm");
  const filterInput = useRef<HTMLInputElement>(null);
  const time = (iso: string) => format.time(iso, { hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3, hourCycle: "h23" });

  // ⌘K / Ctrl+K jumps to the filter, as the hint in the field says.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      filterInput.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  let body: ReactNode;
  if (status === "loading") {
    body = SKELETON_ROWS.map((key) => (
      <TableRow key={key}>
        <TableCell className="ps-4" colSpan={6}>
          <Skeleton className="h-3.5 w-full max-w-xl motion-reduce:animate-none" />
        </TableCell>
      </TableRow>
    ));
  } else if (status === "error" || entries.length === 0) {
    body = (
      <TableRow>
        <TableCell className="whitespace-normal py-12 text-center font-sans" colSpan={6}>
          <p className="font-medium text-sm">{status === "error" ? t.errorTitle : t.emptyTitle}</p>
          <p className="mt-1 text-muted-foreground text-sm">{status === "error" ? error : t.emptyDescription}</p>
          {status === "error" && onRetry ? (
            <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
              {t.retry}
            </Button>
          ) : null}
        </TableCell>
      </TableRow>
    );
  } else {
    body = entries.map((e) => {
      const active = selectedId === e.id;
      return (
        <TableRow className={cn("group transition-colors", active ? "bg-foreground/[0.06]" : e.severity === "error" ? "bg-destructive/[0.04] hover:bg-destructive/[0.08]" : "hover:bg-foreground/[0.03]")} key={e.id}>
          {/* Pinned cell is opaque, so it mixes the row tint into the card colour. */}
          <TableCell
            className={cn(
              "sticky start-0 z-10 ps-4 text-muted-foreground tabular-nums transition-colors",
              active
                ? "bg-[color-mix(in_srgb,var(--card),var(--foreground)_6%)]"
                : e.severity === "error"
                  ? "bg-[color-mix(in_srgb,var(--card),var(--destructive)_4%)] group-hover:bg-[color-mix(in_srgb,var(--card),var(--destructive)_8%)]"
                  : "bg-card group-hover:bg-[color-mix(in_srgb,var(--card),var(--foreground)_3%)]",
            )}
          >
            <time dateTime={e.at}>{time(e.at)}</time>
          </TableCell>
          <TableCell>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className={cn("size-1.5 rounded-full", SEVERITY[e.severity].dot)} />
              <span className={cn("text-[10px] uppercase tracking-wider", SEVERITY[e.severity].label)}>{t[e.severity]}</span>
            </span>
          </TableCell>
          <TableCell className="text-muted-foreground">{e.service}</TableCell>
          <TableCell className="text-muted-foreground">{e.requestId ?? t.noRequest}</TableCell>
          <TableCell className="w-full max-w-0">
            <span className="flex items-center gap-2">
              {e.severity === "error" ? (
                <CircleAlertIcon aria-hidden className="size-3.5 shrink-0 text-destructive-foreground" />
              ) : e.severity === "warn" ? (
                <FlameIcon aria-hidden className="size-3.5 shrink-0 text-category-3-foreground" />
              ) : e.severity === "info" ? (
                <InfoIcon aria-hidden className="size-3.5 shrink-0 text-category-1-foreground/70" />
              ) : null}
              <button
                aria-label={interpolate(t.openDetails, { severity: t[e.severity], time: time(e.at), message: e.message })}
                className="min-w-0 cursor-pointer truncate rounded-sm text-start outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setSelectedId(e.id)}
                type="button"
              >
                {e.message}
              </button>
              {e.status ? (
                <Badge className={cn(tag, "ms-auto shrink-0 font-mono text-[10px]", e.status >= 400 && "border-destructive/30 text-destructive-foreground")} variant="outline">
                  {e.status}
                </Badge>
              ) : null}
            </span>
          </TableCell>
          <TableCell className="pe-4 text-end text-muted-foreground tabular-nums">{e.durationMs !== undefined ? format.number(e.durationMs) : ""}</TableCell>
        </TableRow>
      );
    });
  }

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-12", className)}>
      <div className="mx-auto max-w-6xl">
        <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-center gap-2">
            <TerminalIcon aria-hidden className="size-4 text-muted-foreground" />
            <h1 className="font-heading text-xl">{t.title}</h1>
            {onLiveChange ? (
              <Badge className="ms-1 gap-1.5 font-mono text-[10px]" variant="outline">
                <span aria-hidden className={cn("size-1.5 rounded-full", live ? "animate-pulse bg-category-2 motion-reduce:animate-none" : "bg-muted-foreground/60")} />
                {live ? t.live : t.paused}
              </Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <InputGroup className="min-w-0 flex-1 sm:w-72 sm:flex-none">
              <InputGroupAddon>
                <span aria-hidden className="font-mono text-muted-foreground text-xs">
                  $
                </span>
              </InputGroupAddon>
              <InputGroupInput
                aria-label={t.filter}
                className="font-mono text-xs"
                onChange={(e) => onFilterChange(e.target.value)}
                placeholder={t.filterPlaceholder}
                ref={filterInput}
                type="search"
                value={filter}
              />
              <InputGroupAddon align="inline-end" className="pointer-coarse:hidden">
                <Kbd>⌘K</Kbd>
              </InputGroupAddon>
            </InputGroup>
            {onLiveChange ? (
              <Button aria-label={live ? t.pause : t.resume} className="shrink-0 pointer-coarse:h-10" onClick={() => onLiveChange(!live)} size="sm" variant="outline">
                {live ? <PauseIcon /> : <PlayIcon />}
                <span aria-hidden className="max-sm:hidden">
                  {live ? t.pause : t.resume}
                </span>
              </Button>
            ) : null}
          </div>
        </header>

        {/*
          A real table at every width: same columns, uniform single-line rows.
          Below lg it scrolls sideways inside its card (the page itself never
          does); Time stays pinned so each row keeps its timestamp.
        */}
        <div className="overflow-hidden rounded-xl border bg-card font-mono shadow-xs/5">
          <Table aria-busy={status === "loading"} className="min-w-[860px] text-xs">
            <TableHeader>
              <TableRow className="border-b bg-background">
                <TableHead className="sticky start-0 z-10 bg-background ps-4 text-[10px] uppercase tracking-wider">{t.columnTime}</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">{t.columnLevel}</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">{t.columnService}</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">{t.columnRequest}</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">{t.columnMessage}</TableHead>
                <TableHead className="pe-4 text-end text-[10px] uppercase tracking-wider">{t.columnDuration}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{body}</TableBody>
          </Table>
        </div>
        {status === "ready" && entries.length ? (
          <p className="mt-3 font-mono text-[11px] text-muted-foreground">
            {interpolate(source ? t.footerSource : t.footer, { count: entries.length, source: source ?? "" })} · <span className="text-foreground/80">{t.footerHint}</span>
          </p>
        ) : null}
      </div>

      <Sheet onOpenChange={(open) => !open && setSelectedId(undefined)} open={Boolean(selected)}>
        <SheetContent className={isPhone ? "max-h-[85svh]" : "!max-w-xl"} side={isPhone ? "bottom" : "right"}>
          {selected ? <Details entry={selected} key={selected.id} onNotifyOncall={onNotifyOncall} onRetryRequest={onRetryRequest} traceHref={traceHref} /> : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function LogsTable(props: LogsTableProps) {
  return (
    <ScreenBoundary name="LogsTable">
      <LogsTableScreen {...props} />
    </ScreenBoundary>
  );
}
