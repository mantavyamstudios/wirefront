// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Badge } from "@wirefront/ui/badge";
import { Button, buttonVariants } from "@wirefront/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@wirefront/ui/dropdown-menu";
import { cn } from "@wirefront/ui/lib/utils";
import { Separator } from "@wirefront/ui/separator";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@wirefront/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@wirefront/ui/tooltip";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import { type Action, type AsyncStatus, fail, settle } from "@wirefront/ui/wirefront/types";
import {
  ArrowUpRightIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  MoreHorizontalIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  RotateCwIcon,
  TrashIcon,
  TriangleAlertIcon,
  WebhookIcon,
} from "lucide-react";
import { Highlight, type PrismTheme } from "prism-react-renderer";
import { useState } from "react";
import type { EndpointStatus, WebhookOverview } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("webhookSettings.<key>"). */
export const WEBHOOK_SETTINGS_MESSAGES = {
  title: "Webhooks",
  subtitle: "Send realtime events to your servers.",
  docs: "View docs",
  addEndpoint: "Add endpoint",
  secret: "Signing secret",
  rotate: "Rotate",
  rotateTitle: "Rotate signing secret",
  rotateHint: "The previous secret stays valid for 24 hours so you can roll deploys.",
  reveal: "Reveal signing secret",
  hide: "Hide signing secret",
  copySecret: "Copy signing secret",
  secretUse: "Used to verify the {header} header.",
  url: "URL",
  events: "Events",
  status: "Status",
  lastDelivery: "Last delivery",
  actions: "Actions",
  actionsFor: "Actions for {url}",
  success: "Healthy",
  failing: "Failing",
  paused: "Paused",
  successTip: "Recent deliveries succeeded",
  failingTip: "Recent deliveries are failing",
  pausedTip: "Paused — the endpoint won’t receive events",
  never: "—",
  edit: "Edit",
  pause: "Pause",
  resume: "Resume",
  delete: "Delete",
  noEndpoints: "No endpoints yet.",
  deliveries: "Recent deliveries",
  lastDay: "· last 24 hours",
  filter: "Show",
  all: "All",
  failed: "Failed",
  retried: "Retried",
  retriedInline: " · retried",
  deliveryId: "id",
  attempt: "attempt",
  attemptOf: "{attempt} of {max}",
  duration: "duration",
  resend: "Resend",
  request: "Request",
  response: "Response",
  copy: "Copy",
  copied: "Copied",
  showing: "Showing {shown} of {total} attempts",
  viewAll: "View all deliveries",
  noDeliveries: "No deliveries yet.",
  errorTitle: "Couldn’t load webhooks",
  retry: "Try again",
};

export interface WebhookSettingsProps {
  /** Endpoints, deliveries and the secret hint. Leave it out while it loads. */
  data?: WebhookOverview;
  /** "loading" shows skeletons; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** The header your signatures arrive in, e.g. "Acme-Signature". */
  signatureHeader: string;
  /** Fetch the full signing secret. Reveal and copy only show with this. */
  onRevealSecret?: Action<void, { secret: string }>;
  /** Issue a new secret. "Rotate" only shows with this. */
  onRotateSecret?: Action<void, { secret: string }>;
  /** Open your add-endpoint form. The button only shows with this. */
  onAddEndpoint?: () => void;
  /** Open your edit form for an endpoint (receives its id). */
  onEditEndpoint?: (id: string) => void;
  /** Pause or resume an endpoint. */
  onSetPaused?: Action<{ id: string; paused: boolean }>;
  /** Delete an endpoint (receives its id). */
  onDeleteEndpoint?: Action<string>;
  /** Send a delivery again (receives its id). */
  onResend?: Action<string>;
  /** Where "View docs" goes. Hidden when not given. */
  docsHref?: string;
  /** Where "View all deliveries" goes. Hidden when not given. */
  deliveriesHref?: string;
  className?: string;
}

const STATUS_TONE: Record<EndpointStatus, { dot: string; label: string; tip: "successTip" | "failingTip" | "pausedTip" }> = {
  success: { dot: "bg-category-2", label: "text-category-2-foreground", tip: "successTip" },
  failing: { dot: "bg-destructive", label: "text-destructive-foreground", tip: "failingTip" },
  paused: { dot: "bg-muted-foreground/60", label: "text-muted-foreground", tip: "pausedTip" },
};
const SKELETON_ROWS = ["r1", "r2", "r3"];

function statusTone(code: number): string {
  if (code >= 500) return "border-destructive/30 text-destructive-foreground";
  if (code >= 400) return "border-category-3/40 text-category-3-foreground";
  return "border-category-2/30 text-category-2-foreground";
}

// Theme-adaptive Prism: tokens get Tailwind classes (which respect the dark
// variant) instead of inline colours. The blank theme keeps the tokenizer but
// strips its styling so our classes win.
const PRISM_BLANK: PrismTheme = { plain: {}, styles: [] };
const PRISM_TOKEN_CLASS: Record<string, string> = {
  "string-property": "text-category-1-foreground",
  property: "text-category-1-foreground",
  string: "text-category-2-foreground",
  number: "text-category-3-foreground",
  boolean: "text-category-5-foreground",
  null: "text-category-5-foreground",
  punctuation: "text-muted-foreground",
  operator: "text-muted-foreground",
};
function prismClass(types: string[]): string {
  for (const type of types) {
    const c = PRISM_TOKEN_CLASS[type];
    if (c) return c;
  }
  return "text-foreground/85";
}

type Token = { content: string; types: string[] };
/** Each line and token with its character offset in the code, for stable keys. */
function withOffsets(lines: Token[][]) {
  let offset = 0;
  return lines.map((line, i) => {
    const start = offset;
    let at = start;
    const parts = line
      .map((token) => {
        const part = { token, at };
        at += token.content.length;
        return part;
      })
      .filter((p) => p.token.content.length > 0);
    offset = at + 1;
    return { line, number: i + 1, offset: start, parts };
  });
}

function PayloadBlock({ label, body, status, t }: { label: string; body: string; status?: number; t: typeof WEBHOOK_SETTINGS_MESSAGES }) {
  const [copied, setCopied] = useState(false);
  const copy = useAction(
    async () => {
      if (!navigator.clipboard) return fail(t.copy);
      await navigator.clipboard.writeText(body);
    },
    {
      onSuccess: () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      },
    },
  );
  return (
    <div className="overflow-hidden rounded-md border border-border/60 bg-background">
      <div className="flex items-center justify-between border-border/60 border-b px-2.5 py-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{label}</span>
          {status !== undefined ? (
            <Badge className={cn("h-4.5 rounded-sm px-1 font-mono text-[9px]", statusTone(status))} variant="outline">
              {status}
            </Badge>
          ) : null}
        </div>
        <button
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] outline-none transition-colors hover:bg-foreground/[0.05] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => void copy.run()}
          type="button"
        >
          {copied ? <CheckIcon aria-hidden className="size-3 text-category-2-foreground" /> : <CopyIcon aria-hidden className="size-3" />}
          {copied ? t.copied : t.copy} <span className="sr-only">{label}</span>
        </button>
      </div>
      <Highlight code={body.trim()} language="json" theme={PRISM_BLANK}>
        {({ tokens, getLineProps }) => (
          <pre className="whitespace-pre-wrap break-all px-3 py-2 font-mono text-[11px] leading-relaxed">
            {withOffsets(tokens).map(({ line, number, offset, parts }) => (
              // Lines and tokens are keyed by where they start in the body.
              <div key={`line-${offset}`} {...getLineProps({ line })} className="table-row">
                <span className="table-cell select-none pe-3 text-end text-muted-foreground tabular-nums">{number}</span>
                <span className="table-cell whitespace-pre">
                  {parts.length
                    ? parts.map(({ token, at }) => (
                        <span className={prismClass(token.types)} key={`token-${at}`}>
                          {token.content}
                        </span>
                      ))
                    : " "}
                </span>
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}

function WebhookSettingsScreen({
  data,
  status = "ready",
  error,
  onRetry,
  signatureHeader,
  onRevealSecret,
  onRotateSecret,
  onAddEndpoint,
  onEditEndpoint,
  onSetPaused,
  onDeleteEndpoint,
  onResend,
  docsHref,
  deliveriesHref,
  className,
}: WebhookSettingsProps) {
  const t = useMessages("webhookSettings", WEBHOOK_SETTINGS_MESSAGES);
  const format = useFormat();
  const [secret, setSecret] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [filter, setFilter] = useState<"all" | "failed">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const reveal = useAction(onRevealSecret ?? (async () => fail("")), {
    onSuccess: (r) => {
      setSecret(r.secret);
      setShown(true);
    },
  });
  const rotate = useAction(onRotateSecret ?? (async () => fail("")), {
    onSuccess: (r) => {
      setSecret(r.secret);
      setShown(true);
    },
  });
  const copySecret = useAction(
    async () => {
      // Fetch the secret first if it hasn't been revealed yet.
      let value = secret;
      if (!value && onRevealSecret) {
        const result = await settle(onRevealSecret, undefined);
        if (!result.ok) return result;
        value = result.data.secret;
        setSecret(value);
      }
      if (!value || !navigator.clipboard) return fail(t.copySecret);
      await navigator.clipboard.writeText(value);
    },
    {
      onSuccess: () => {
        setCopiedSecret(true);
        window.setTimeout(() => setCopiedSecret(false), 1200);
      },
    },
  );
  const setPaused = useAction(onSetPaused ?? (async () => {}));
  const remove = useAction(onDeleteEndpoint ?? (async () => {}));
  const resend = useAction(onResend ?? (async () => {}));
  const failure = reveal.error || rotate.error || setPaused.error || remove.error || resend.error;

  const ready = status === "ready" && data ? data : undefined;
  const deliveries = ready?.deliveries ?? [];
  const filtered = filter === "failed" ? deliveries.filter((d) => d.status >= 400) : deliveries;
  const masked = `whsec_••••••••••••${ready?.secretHint ?? ""}`;
  const ms = (n: number) => format.number(n, { style: "unit", unit: "millisecond", unitDisplay: "narrow", maximumFractionDigits: 0 });
  const time = (iso: string) => format.time(iso, { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  const hasMenu = Boolean(onEditEndpoint || onSetPaused || onDeleteEndpoint);

  return (
    <div className={cn("min-h-svh bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12", className)}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <h1 className="flex items-center gap-2 font-heading text-xl">
              <WebhookIcon aria-hidden className="size-5 text-muted-foreground" />
              {t.title}
            </h1>
            <p className="text-muted-foreground text-sm">{t.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {docsHref ? (
              <WirefrontLink className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "text-muted-foreground hover:text-foreground")} href={docsHref}>
                {t.docs}
                <ArrowUpRightIcon />
              </WirefrontLink>
            ) : null}
            {onAddEndpoint ? (
              <Button onClick={onAddEndpoint} size="sm">
                <PlusIcon />
                {t.addEndpoint}
              </Button>
            ) : null}
          </div>
        </header>

        {status === "error" ? (
          <div className="rounded-xl border border-border/60 p-10 text-center">
            <p className="font-medium">{t.errorTitle}</p>
            {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
            {onRetry ? (
              <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                {t.retry}
              </Button>
            ) : null}
          </div>
        ) : !ready ? (
          <div aria-busy="true" className="flex flex-col gap-6">
            {SKELETON_ROWS.map((key) => (
              <Skeleton className="h-40 w-full rounded-xl motion-reduce:animate-none" key={key} />
            ))}
          </div>
        ) : (
          <>
            {failure ? (
              <p className="mb-4 text-destructive-foreground text-sm" role="alert">
                {failure}
              </p>
            ) : null}

            {/* Signing secret: label + Rotate on top, the secret spans the card, explanation underneath. */}
            <section aria-labelledby="webhook-secret" className="mb-6 rounded-xl border bg-card px-4 py-3 shadow-xs/5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]" id="webhook-secret">
                  {t.secret}
                </h2>
                {onRotateSecret ? (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <button
                          aria-busy={rotate.isPending()}
                          className="inline-flex min-h-8 items-center gap-1 rounded text-category-3-foreground text-xs underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 pointer-coarse:min-h-10"
                          disabled={rotate.isPending()}
                          onClick={() => void rotate.run()}
                          type="button"
                        />
                      }
                    >
                      {rotate.isPending() ? <Spinner /> : <TriangleAlertIcon aria-hidden className="size-3.5" />}
                      {t.rotate}
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[260px] p-2 text-start" side="top">
                      <p className="font-medium text-foreground">{t.rotateTitle}</p>
                      <p className="mt-0.5 text-muted-foreground">{t.rotateHint}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
              <div className="mt-2 flex w-full min-w-0 items-center gap-1 rounded-md border bg-background py-1 ps-2.5 pe-1 font-mono text-xs">
                <span className="min-w-0 flex-1 truncate text-foreground/85">{shown && secret ? secret : masked}</span>
                {onRevealSecret ? (
                  <>
                    <Button
                      aria-busy={reveal.isPending()}
                      aria-label={shown ? t.hide : t.reveal}
                      className="size-7 shrink-0 pointer-coarse:size-9"
                      disabled={reveal.isPending()}
                      onClick={() => (shown ? setShown(false) : secret ? setShown(true) : void reveal.run())}
                      size="icon"
                      variant="ghost"
                    >
                      {shown ? <EyeOffIcon className="!size-3" /> : <EyeIcon className="!size-3" />}
                    </Button>
                    <Button aria-label={t.copySecret} className="-me-1 size-7 shrink-0 pointer-coarse:size-9" onClick={() => void copySecret.run()} size="icon" variant="ghost">
                      {copiedSecret ? <CheckIcon className="!size-3 text-category-2-foreground" /> : <CopyIcon className="!size-3" />}
                    </Button>
                  </>
                ) : null}
              </div>
              <p className="mt-2 text-muted-foreground text-xs">
                {t.secretUse.split("{header}")[0]}
                <code className="font-mono">{signatureHeader}</code>
                {t.secretUse.split("{header}")[1]}
              </p>
            </section>

            <div className="mb-10 overflow-hidden rounded-xl border bg-card shadow-xs/5">
              {ready.endpoints.length === 0 ? (
                <p className="px-4 py-10 text-center text-muted-foreground text-sm">{t.noEndpoints}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="ps-4 text-[10px] uppercase tracking-wider">{t.url}</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider max-lg:hidden">{t.events}</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider max-sm:hidden">{t.status}</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider max-md:hidden">{t.lastDelivery}</TableHead>
                      {hasMenu ? (
                        <TableHead className="w-px pe-4">
                          <span className="sr-only">{t.actions}</span>
                        </TableHead>
                      ) : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ready.endpoints.map((ep) => {
                      const tone = STATUS_TONE[ep.status];
                      const visible = ep.events.slice(0, 2);
                      const overflow = ep.events.length - visible.length;
                      const last = ep.lastDeliveryAt ? format.relative(ep.lastDeliveryAt) : t.never;
                      return (
                        <TableRow key={ep.id}>
                          <TableCell className="w-full max-w-0 ps-4 sm:w-auto sm:max-w-none">
                            <div className="flex items-center gap-2 font-mono text-xs sm:max-w-[280px]">
                              <span className="truncate text-foreground/90">{ep.url}</span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-[10px] text-muted-foreground">
                              {ep.id}
                              <span className="inline-flex items-center gap-1 sm:hidden">
                                <span aria-hidden className={cn("size-1.5 rounded-full", tone.dot)} />
                                <span className={cn("uppercase tracking-wider", tone.label)}>{t[ep.status]}</span>
                              </span>
                              <span className="md:hidden">· {last}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-lg:hidden">
                            <div className="flex flex-wrap items-center gap-1">
                              {visible.map((e) => (
                                <Badge className="h-4.5 rounded-sm px-1 font-mono text-[10px]" key={e} variant="outline">
                                  {e}
                                </Badge>
                              ))}
                              {overflow > 0 ? (
                                <Badge className="h-4.5 rounded-sm px-1 font-mono text-[10px] text-muted-foreground" title={ep.events.slice(2).join(", ")} variant="outline">
                                  +{overflow}
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="max-sm:hidden">
                            <span className="inline-flex items-center gap-2" title={t[tone.tip]}>
                              <span aria-hidden className={cn("size-1.5 rounded-full", tone.dot)} />
                              <span className={cn("text-[10px] uppercase tracking-wider", tone.label)}>{t[ep.status]}</span>
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground tabular-nums max-md:hidden">{last}</TableCell>
                          {hasMenu ? (
                            <TableCell className="pe-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger render={<Button aria-label={interpolate(t.actionsFor, { url: ep.url })} size="icon" variant="ghost" />}>
                                  <MoreHorizontalIcon />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {onEditEndpoint ? (
                                    <DropdownMenuItem onClick={() => onEditEndpoint(ep.id)}>
                                      <PencilIcon /> {t.edit}
                                    </DropdownMenuItem>
                                  ) : null}
                                  {onSetPaused ? (
                                    <DropdownMenuItem onClick={() => void setPaused.run({ id: ep.id, paused: ep.status !== "paused" }, ep.id)}>
                                      {ep.status === "paused" ? <PlayIcon /> : <PauseIcon />} {ep.status === "paused" ? t.resume : t.pause}
                                    </DropdownMenuItem>
                                  ) : null}
                                  {onDeleteEndpoint ? (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => void remove.run(ep.id, ep.id)} variant="destructive">
                                        <TrashIcon /> {t.delete}
                                      </DropdownMenuItem>
                                    </>
                                  ) : null}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          ) : null}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            <section aria-labelledby="webhook-deliveries" className="overflow-hidden rounded-xl border bg-card shadow-xs/5">
              <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <h2 className="font-heading text-sm" id="webhook-deliveries">
                    {t.deliveries}
                  </h2>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{t.lastDay}</span>
                </div>
                <RadioGroup aria-label={t.filter} className="inline-flex items-center rounded-md border bg-background p-0.5 text-xs" onValueChange={(v) => setFilter(v as "all" | "failed")} value={filter}>
                  {(["all", "failed"] as const).map((f) => (
                    <Radio.Root
                      className="cursor-pointer rounded px-2 py-0.5 font-mono text-[11px] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-foreground/[0.08] data-checked:text-foreground pointer-coarse:min-h-9 pointer-coarse:px-3"
                      key={f}
                      value={f}
                    >
                      {f === "all" ? t.all : t.failed}
                    </Radio.Root>
                  ))}
                </RadioGroup>
              </header>

              {filtered.length === 0 ? (
                <p className="px-4 py-10 text-center text-muted-foreground text-sm">{t.noDeliveries}</p>
              ) : (
                <ul className="divide-y divide-border/60 font-mono text-xs">
                  {filtered.map((d) => {
                    const expanded = expandedId === d.id;
                    const retried = d.attempt > 1;
                    return (
                      <li key={d.id}>
                        <button
                          aria-expanded={expanded}
                          // Below sm: event + status + chevron on line 1, time · endpoint · ms on line 2.
                          className="grid w-full grid-cols-[minmax(0,1fr)_auto_16px] items-center gap-x-3 gap-y-0.5 px-4 py-2.5 text-start outline-none transition-colors hover:bg-foreground/[0.03] focus-visible:bg-foreground/[0.05] sm:grid-cols-[64px_minmax(0,160px)_minmax(0,1fr)_56px_64px_24px]"
                          onClick={() => setExpandedId(expanded ? null : d.id)}
                          type="button"
                        >
                          <time className="text-muted-foreground tabular-nums max-sm:hidden" dateTime={d.at}>
                            {time(d.at)}
                          </time>{" "}
                          <span className="truncate text-foreground/90">{d.event}</span>{" "}
                          <span className="truncate text-muted-foreground max-sm:hidden">{d.endpoint}</span>{" "}
                          <Badge className={cn("h-4.5 justify-center rounded-sm px-1 font-mono text-[10px]", statusTone(d.status))} variant="outline">
                            {d.status}
                          </Badge>{" "}
                          <span className="flex items-center justify-end gap-1 text-muted-foreground tabular-nums max-sm:hidden">
                            {retried ? <RotateCwIcon aria-label={t.retried} className="size-3 text-category-3-foreground" role="img" /> : null}
                            {ms(d.durationMs)}
                          </span>
                          <ChevronDownIcon aria-hidden className={cn("size-3.5 text-muted-foreground transition-transform", expanded && "rotate-180")} />
                          <span aria-hidden className="col-start-1 truncate text-[11px] text-muted-foreground tabular-nums sm:hidden">
                            {time(d.at)} · {d.endpoint} · {ms(d.durationMs)}{retried ? t.retriedInline : ""}
                          </span>
                        </button>
                        {expanded ? (
                          <div className="border-t bg-foreground/[0.02] px-4 py-3 dark:bg-white/[0.02]">
                            <dl className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                              <div className="flex gap-1">
                                <dt className="text-muted-foreground">{t.deliveryId}</dt>
                                <dd className="text-foreground/85">{d.id}</dd>
                              </div>
                              <div className="flex gap-1">
                                <dt className="text-muted-foreground">{t.attempt}</dt>
                                <dd className="text-foreground/85">{interpolate(t.attemptOf, { attempt: d.attempt, max: d.maxAttempts })}</dd>
                              </div>
                              <div className="flex gap-1">
                                <dt className="text-muted-foreground">{t.duration}</dt>
                                <dd className="text-foreground/85">{ms(d.durationMs)}</dd>
                              </div>
                              {onResend ? (
                                <div className="ms-auto">
                                  <Button aria-busy={resend.isPending(d.id)} disabled={resend.isPending(d.id)} onClick={() => void resend.run(d.id, d.id)} size="xs" variant="outline">
                                    {resend.isPending(d.id) ? <Spinner data-icon="inline-start" /> : <RotateCwIcon />} {t.resend}
                                  </Button>
                                </div>
                              ) : null}
                            </dl>
                            <div className="grid gap-3 md:grid-cols-2">
                              <PayloadBlock body={d.request} label={t.request} t={t} />
                              <PayloadBlock body={d.response} label={t.response} status={d.status} t={t} />
                            </div>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
              <Separator />
              <div className="flex items-center justify-between px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
                <span>{interpolate(t.showing, { shown: filtered.length, total: deliveries.length })}</span>
                {deliveriesHref ? (
                  <WirefrontLink className="inline-flex items-center gap-1 rounded outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" href={deliveriesHref}>
                    {t.viewAll}
                    <ArrowUpRightIcon aria-hidden className="size-3" />
                  </WirefrontLink>
                ) : null}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export function WebhookSettings(props: WebhookSettingsProps) {
  return (
    <ScreenBoundary name="WebhookSettings">
      <WebhookSettingsScreen {...props} />
    </ScreenBoundary>
  );
}
