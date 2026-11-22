// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button, buttonVariants } from "@wirefront/ui/button";
import { Checkbox } from "@wirefront/ui/checkbox";
import { cn } from "@wirefront/ui/lib/utils";
import { Progress } from "@wirefront/ui/progress";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Slider } from "@wirefront/ui/slider";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
  useWirefront,
  WirefrontLink,
} from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FileArchiveIcon,
  HourglassIcon,
  ShieldOffIcon,
  TimerResetIcon,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import type {
  DataExport,
  PrivacySettings,
  RequestExportInput,
  RetentionDays,
  SetRetentionInput,
} from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("privacyData.<key>"). */
export const PRIVACY_DATA_MESSAGES = {
  eyebrow: "Settings · Privacy & data",
  title: "Privacy & data",
  subtitle:
    "Export what we have, decide how long it sticks around, or shut it down for good.",
  exportTitle: "Export your data",
  exportHint:
    "Bundle everything we hold for you into a single archive. We’ll email a download link when it’s ready.",
  approx: "Approx",
  include: "Include in archive",
  willEmail: "We’ll prepare the archive and email {email} when it’s ready.",
  generate: "Generate export",
  preparing: "Preparing archive…",
  compressing: "Compressing {count} categories — this stays in the background.",
  ready: "Archive ready",
  readyDetail: "{file} · link expires {when}",
  download: "Download",
  retentionTitle: "Data retention",
  retentionHint:
    "Auto-delete older content on a schedule. Workspace admins can tighten — never loosen — these rules.",
  retentionOf: "{label} retention",
  days: "{days}d",
  forever: "Forever",
  keptForever: "{noun} are kept indefinitely. Nothing is auto-deleted.",
  deletedAfter:
    "{noun} older than {days} days will be permanently deleted at the end of each month.",
  deleteTitle: "Delete this account",
  deleteHint:
    "This is irreversible. We hold a 30-day grace window so you can change your mind.",
  pendingHint:
    "Your account is queued for deletion. Cancel any time before the deadline.",
  whatHappens: "What happens",
  deleteNow: "Profile, sessions, API tokens",
  deleteNowWhen: "Deleted immediately",
  deleteGrace: "Messages, files, comments",
  deleteGraceWhen: "Recoverable for 30 days, then purged",
  deleteLegal: "Billing & audit records",
  deleteLegalWhen: "Retained 90 days for legal compliance",
  tagNow: "Now",
  tagGrace: "30 days",
  tagLegal: "90 days",
  confirmEmail:
    "You’ll receive a confirmation email before anything is touched.",
  requestDeletion: "Request account deletion",
  daysLeft: "days left",
  scheduled: "Deletion scheduled",
  scheduledOn:
    "We’ll permanently delete your account on {date}. Cancel any time before then.",
  requested: "Pending deletion · requested {date}",
  cancelHint:
    "Cancelling restores your account to its current state immediately.",
  cancelDeletion: "Cancel deletion request",
  errorTitle: "Couldn’t load privacy settings",
  retry: "Try again",
};

export interface PrivacyDataProps {
  /** Export options, retention rules and deletion status. Leave it out while it loads. */
  data?: PrivacySettings;
  /** "loading" shows skeletons; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Start an export of the chosen category ids. Report progress by passing `data.latestExport`. Hidden without it. */
  onRequestExport?: Action<RequestExportInput>;
  /** Change a retention rule. Sliders are read-only without it. */
  onSetRetention?: Action<SetRetentionInput>;
  /** Queue the account for deletion. Hidden without it. */
  onRequestDeletion?: Action;
  /** Cancel a queued deletion. Hidden without it. */
  onCancelDeletion?: Action;
  className?: string;
}

/** The retention choices, shortest first; null keeps data forever. */
const STOPS: RetentionDays[] = [30, 90, 180, 365, null];
const GRACE_DAYS = 30;
const DAY = 86_400_000;
const fieldError = "text-destructive-foreground text-xs";

function PrivacyDataScreen({
  data,
  status = "ready",
  error,
  onRetry,
  onRequestExport,
  onSetRetention,
  onRequestDeletion,
  onCancelDeletion,
  className,
}: PrivacyDataProps) {
  const t = useMessages("privacyData", PRIVACY_DATA_MESSAGES);
  const format = useFormat();
  const { now } = useWirefront();
  const id = useId();
  const [include, setInclude] = useState<Record<string, boolean>>({});
  const [retention, setRetention] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!data) return;
    setInclude(
      Object.fromEntries(
        data.categories.map((c) => [c.id, c.includedByDefault])
      )
    );
    setRetention(
      Object.fromEntries(
        data.retention.map((r) => [r.id, Math.max(0, STOPS.indexOf(r.days))])
      )
    );
  }, [data]);

  const requestExport = useAction(onRequestExport ?? (async () => {}));
  const saveRetention = useAction(onSetRetention ?? (async () => {}), {
    onError: (_, input) => {
      // Put the slider back where the saved rule is.
      const saved = data?.retention.find((r) => r.id === input.id);
      if (saved)
        setRetention((all) => ({
          ...all,
          [input.id]: Math.max(0, STOPS.indexOf(saved.days)),
        }));
    },
  });
  const requestDeletion = useAction(onRequestDeletion ?? (async () => {}));
  const cancelDeletion = useAction(onCancelDeletion ?? (async () => {}));

  const size = (n: number) => {
    const gb = n >= 1024 ** 3;
    return format.number(gb ? n / 1024 ** 3 : n / 1024 ** 2, {
      style: "unit",
      unit: gb ? "gigabyte" : "megabyte",
      maximumFractionDigits: 1,
      unitDisplay: "short",
    });
  };
  const stopLabel = (i: number) => {
    const d = STOPS[i];
    return d === null || d === undefined
      ? t.forever
      : interpolate(t.days, { days: d });
  };

  const ready = status === "ready" && data ? data : undefined;
  const chosen = ready?.categories.filter((c) => include[c.id]) ?? [];
  const total = chosen.reduce((sum, c) => sum + c.bytes, 0);
  const exp: DataExport | null = ready?.latestExport ?? null;
  const deletion = ready?.deletion ?? null;
  const daysLeft = deletion
    ? Math.max(
        0,
        Math.ceil((Date.parse(deletion.scheduledFor) - now().getTime()) / DAY)
      )
    : 0;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const day = (iso: string) =>
    format.date(iso, { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          {t.eyebrow}
        </div>
        <h1 className="mt-1 font-heading text-3xl">{t.title}</h1>
        <p className="mt-1.5 text-muted-foreground text-sm">{t.subtitle}</p>

        {status === "error" ? (
          <div className="mt-8 rounded-xl border border-border/60 p-10 text-center">
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
        ) : !ready ? (
          <div aria-busy="true" className="mt-8 flex flex-col gap-3">
            <Skeleton className="h-64 w-full rounded-xl motion-reduce:animate-none" />
            <Skeleton className="h-64 w-full rounded-xl motion-reduce:animate-none" />
          </div>
        ) : (
          <>
            {onRequestExport ? (
              <section
                aria-labelledby={`${id}-export`}
                className="mt-8 rounded-xl border border-border/60 bg-background/40"
              >
                <div className="flex flex-wrap items-start gap-3 p-4 sm:flex-nowrap sm:gap-4 sm:p-6">
                  <div
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-md bg-foreground/6"
                  >
                    <FileArchiveIcon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1 max-sm:basis-[calc(100%-3rem)]">
                    <h2 className="font-heading text-base" id={`${id}-export`}>
                      {t.exportTitle}
                    </h2>
                    <p className="mt-1 text-muted-foreground text-sm">
                      {t.exportHint}
                    </p>
                  </div>
                  <div className="max-sm:ms-12 sm:text-end">
                    <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                      {t.approx}
                    </div>
                    <div className="mt-0.5 font-heading text-xl tabular-nums">
                      {size(total)}
                    </div>
                  </div>
                </div>

                <fieldset
                  className="m-0 min-w-0 border-0 border-border/40 border-t px-4 py-4 sm:px-6"
                  disabled={exp?.status === "running"}
                >
                  <legend className="float-start font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                    {t.include}
                  </legend>
                  <ul className="clear-both flex flex-col gap-1 pt-3">
                    {ready.categories.map((c) => {
                      const boxId = `${id}-cat-${c.id}`;
                      return (
                        <li
                          className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-foreground/3 pointer-coarse:min-h-11"
                          key={c.id}
                        >
                          <Checkbox
                            checked={Boolean(include[c.id])}
                            id={boxId}
                            onCheckedChange={(v) =>
                              setInclude((s) => ({ ...s, [c.id]: v === true }))
                            }
                          />
                          {/* Below sm the hint drops under the label so the label keeps its width. */}
                          <label
                            className="min-w-0 flex-1 cursor-pointer text-sm sm:flex sm:items-center sm:gap-3"
                            htmlFor={boxId}
                          >
                            <span className="block sm:flex-1">{c.label}</span>{" "}
                            <span className="block font-mono text-[10px] text-muted-foreground uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                              {c.hint}
                            </span>
                          </label>
                          <span className="shrink-0 text-end font-mono text-xs tabular-nums sm:w-16">
                            {size(c.bytes)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>

                <div
                  aria-live="polite"
                  className="border-border/40 border-t p-4"
                >
                  {exp?.status === "running" ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="inline-flex items-center gap-2">
                          <HourglassIcon
                            aria-hidden
                            className="size-3.5 animate-pulse text-muted-foreground motion-reduce:animate-none"
                          />
                          {t.preparing}
                        </span>
                        <span className="font-mono text-xs tabular-nums">
                          {format.number(exp.progress / 100, {
                            style: "percent",
                          })}
                        </span>
                      </div>
                      <Progress aria-label={t.preparing} value={exp.progress} />
                      <p className="text-muted-foreground text-xs">
                        {interpolate(t.compressing, { count: chosen.length })}
                      </p>
                    </div>
                  ) : exp?.status === "ready" ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-category-2/8 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2Icon
                          aria-hidden
                          className="size-4 text-category-2-foreground"
                        />
                        <div>
                          <div className="font-medium text-sm">{t.ready}</div>
                          <p className="text-muted-foreground text-xs">
                            {exp.expiresAt
                              ? interpolate(t.readyDetail, {
                                  file: exp.fileName,
                                  when: format.relative(exp.expiresAt),
                                })
                              : exp.fileName}
                          </p>
                        </div>
                      </div>
                      {exp.downloadUrl ? (
                        <WirefrontLink
                          className={buttonVariants({ size: "sm" })}
                          download
                          href={exp.downloadUrl}
                        >
                          <DownloadIcon />
                          {t.download}
                        </WirefrontLink>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-muted-foreground text-xs">
                        {interpolate(t.willEmail, { email: ready.email })}
                      </p>
                      <Button
                        aria-busy={requestExport.isPending()}
                        disabled={
                          chosen.length === 0 || requestExport.isPending()
                        }
                        onClick={() =>
                          void requestExport.run({
                            categories: chosen.map((c) => c.id),
                          })
                        }
                        size="sm"
                        type="button"
                      >
                        {requestExport.isPending() ? (
                          <Spinner data-icon="inline-start" />
                        ) : null}
                        {t.generate}
                      </Button>
                    </div>
                  )}
                  {requestExport.error ? (
                    <p className={cn(fieldError, "mt-2")} role="alert">
                      {requestExport.error}
                    </p>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section
              aria-labelledby={`${id}-retention`}
              className="mt-3 rounded-xl border border-border/60 bg-background/40"
            >
              <div className="flex items-start gap-3 p-4 sm:gap-4 sm:p-6">
                <div
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-md bg-foreground/6"
                >
                  <TimerResetIcon className="size-4" />
                </div>
                <div className="flex-1">
                  <h2 className="font-heading text-base" id={`${id}-retention`}>
                    {t.retentionTitle}
                  </h2>
                  <p className="mt-1 text-muted-foreground text-sm">
                    {t.retentionHint}
                  </p>
                </div>
              </div>
              {saveRetention.error ? (
                <p className={cn(fieldError, "px-6 pb-3")} role="alert">
                  {saveRetention.error}
                </p>
              ) : null}
              <div className="border-border/40 border-t px-4 py-2 sm:px-6">
                {ready.retention.map((rule) => {
                  const stop = retention[rule.id] ?? 0;
                  const days = STOPS[stop] ?? null;
                  const labelId = `${id}-ret-${rule.id}`;
                  return (
                    <div
                      className="border-border/40 border-b py-5 last:border-b-0"
                      key={rule.id}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm">{rule.label}</h3>
                        <span className="rounded bg-foreground/6 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] tabular-nums">
                          {stopLabel(stop)}
                        </span>
                      </div>
                      <div className="mt-3 px-1">
                        <span className="sr-only" id={labelId}>
                          {interpolate(t.retentionOf, { label: rule.label })}
                        </span>
                        <Slider
                          aria-labelledby={labelId}
                          disabled={!onSetRetention}
                          max={STOPS.length - 1}
                          min={0}
                          onValueChange={(v) =>
                            setRetention((s) => ({
                              ...s,
                              [rule.id]: (Array.isArray(v) ? v[0] : v) ?? 0,
                            }))
                          }
                          onValueCommitted={(v) => {
                            const i = (Array.isArray(v) ? v[0] : v) ?? 0;
                            void saveRetention.run(
                              { id: rule.id, days: STOPS[i] ?? null },
                              rule.id
                            );
                          }}
                          step={1}
                          value={[stop]}
                        />
                        <div
                          aria-hidden
                          className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] tabular-nums"
                        >
                          {STOPS.map((d, i) => (
                            <span
                              className={
                                i === stop
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }
                              key={d ?? "forever"}
                            >
                              {stopLabel(i)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="mt-3 text-muted-foreground text-xs">
                        {days === null
                          ? interpolate(t.keptForever, { noun: rule.noun })
                          : interpolate(t.deletedAfter, {
                              noun: rule.noun,
                              days,
                            })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {onRequestDeletion || (deletion && onCancelDeletion) ? (
              <section
                aria-labelledby={`${id}-delete`}
                className="relative mt-3 overflow-hidden rounded-xl border border-destructive/40 bg-destructive/2.5"
              >
                <div className="flex items-start gap-3 p-4 sm:gap-4 sm:p-6">
                  <div
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive-foreground"
                  >
                    {deletion ? (
                      <AlertTriangleIcon className="size-4" />
                    ) : (
                      <ShieldOffIcon className="size-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-heading text-base" id={`${id}-delete`}>
                      {t.deleteTitle}
                    </h2>
                    <p className="mt-1 text-muted-foreground text-sm">
                      {deletion ? t.pendingHint : t.deleteHint}
                    </p>
                  </div>
                </div>

                {deletion ? (
                  <div className="border-destructive/20 border-t">
                    <div className="flex items-center gap-4 p-4 sm:gap-6 sm:p-6">
                      <div className="relative flex size-24 shrink-0 items-center justify-center">
                        <svg
                          aria-hidden
                          className="size-24 -rotate-90"
                          viewBox="0 0 100 100"
                        >
                          <circle
                            className="text-destructive/15"
                            cx="50"
                            cy="50"
                            fill="none"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="6"
                          />
                          <circle
                            className="text-destructive-foreground transition-[stroke-dashoffset] duration-700"
                            cx="50"
                            cy="50"
                            fill="none"
                            r={radius}
                            stroke="currentColor"
                            strokeDasharray={circumference}
                            strokeDashoffset={
                              circumference *
                              (1 - Math.min(1, daysLeft / GRACE_DAYS))
                            }
                            strokeLinecap="round"
                            strokeWidth="6"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="font-heading text-xl tabular-nums">
                            {daysLeft}
                          </div>
                          <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-[0.2em]">
                            {t.daysLeft}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{t.scheduled}</h3>
                        <p className="mt-1 text-muted-foreground text-sm">
                          {interpolate(t.scheduledOn, {
                            date: format.date(deletion.scheduledFor, {
                              dateStyle: "long",
                              timeStyle: "short",
                            }),
                          })}
                        </p>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-foreground/4 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em]">
                          <span
                            aria-hidden
                            className="size-1.5 rounded-full bg-destructive"
                          />
                          {interpolate(t.requested, {
                            date: day(deletion.requestedAt),
                          })}
                        </div>
                      </div>
                    </div>
                    {onCancelDeletion ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 border-destructive/20 border-t p-4">
                        <p className="text-muted-foreground text-xs">
                          {t.cancelHint}
                        </p>
                        <Button
                          aria-busy={cancelDeletion.isPending()}
                          disabled={cancelDeletion.isPending()}
                          onClick={() => void cancelDeletion.run()}
                          size="sm"
                          type="button"
                        >
                          {cancelDeletion.isPending() ? (
                            <Spinner data-icon="inline-start" />
                          ) : null}
                          {t.cancelDeletion}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <div className="border-destructive/20 border-t px-4 py-4 sm:px-6">
                      <h3 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                        {t.whatHappens}
                      </h3>
                      <ul className="mt-3 flex flex-col gap-1.5 text-sm">
                        {[
                          {
                            key: "now",
                            dot: "bg-destructive",
                            label: t.deleteNow,
                            when: t.deleteNowWhen,
                            tag: t.tagNow,
                          },
                          {
                            key: "grace",
                            dot: "bg-category-3",
                            label: t.deleteGrace,
                            when: t.deleteGraceWhen,
                            tag: t.tagGrace,
                          },
                          {
                            key: "legal",
                            dot: "bg-muted-foreground/60",
                            label: t.deleteLegal,
                            when: t.deleteLegalWhen,
                            tag: t.tagLegal,
                          },
                        ].map((row) => (
                          // Below sm the explanation moves under the label instead of a fixed 11rem column.
                          <li
                            className="flex items-start gap-3 sm:items-center"
                            key={row.key}
                          >
                            <span
                              aria-hidden
                              className={cn(
                                "mt-1.5 size-1.5 shrink-0 rounded-full sm:mt-0",
                                row.dot
                              )}
                            />
                            <span className="min-w-0 flex-1">
                              {row.label}
                              <span className="mt-0.5 block text-muted-foreground text-xs sm:hidden">
                                {row.when}
                              </span>
                            </span>
                            <span className="shrink-0 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                              {row.tag}
                            </span>
                            <span className="w-44 text-end text-muted-foreground text-xs max-sm:hidden">
                              {row.when}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-destructive/20 border-t p-4">
                      <p className="text-muted-foreground text-xs">
                        {t.confirmEmail}
                      </p>
                      <Button
                        aria-busy={requestDeletion.isPending()}
                        className="border-destructive/40 text-destructive-foreground hover:bg-destructive/10"
                        disabled={requestDeletion.isPending()}
                        onClick={() => void requestDeletion.run()}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {requestDeletion.isPending() ? (
                          <Spinner data-icon="inline-start" />
                        ) : null}
                        {t.requestDeletion}
                      </Button>
                    </div>
                  </>
                )}
                {requestDeletion.error || cancelDeletion.error ? (
                  <p className={cn(fieldError, "px-4 pb-4")} role="alert">
                    {requestDeletion.error ?? cancelDeletion.error}
                  </p>
                ) : null}
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export function PrivacyData(props: PrivacyDataProps) {
  return (
    <ScreenBoundary name="PrivacyData">
      <PrivacyDataScreen {...props} />
    </ScreenBoundary>
  );
}
