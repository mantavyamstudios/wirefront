// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Badge } from "@wirefront/ui/badge";
import { Button, buttonVariants } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { RadioGroup, RadioGroupItem } from "@wirefront/ui/radio-group";
import { Separator } from "@wirefront/ui/separator";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Switch } from "@wirefront/ui/switch";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { TerminalIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { DebugLogLine, DeveloperSettings, FlagStatus, LogLevel, SetFlagInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("developerLabs.<key>"). */
export const DEVELOPER_LABS_MESSAGES = {
  eyebrow: "Settings · Developer & Labs",
  title: "Developer",
  subtitle: "Experimental features, debug tooling, and feature flags.",
  apiExplorer: "API explorer",
  flags: "Feature flags",
  flagsHint: "Toggles roll out per-account. Experimental flags can change or disappear without notice.",
  flagsOn: "{on} / {total} on",
  stable: "Stable",
  beta: "Beta",
  experimental: "Experimental",
  debug: "Debug mode",
  debugHint: "Verbose tooling for engineers. Off by default.",
  debugDetail: "Surfaces telemetry events, render timings, and request IDs in the UI.",
  console: "console · live",
  lines: "{count} lines",
  noLines: "Waiting for events…",
  environment: "Environment",
  environmentHint: "Point the client at a different backend.",
  adminOnly: "Admin-only — contact your workspace owner to change.",
  errorTitle: "Couldn’t load developer settings",
  retry: "Try again",
};

export interface DeveloperLabsProps {
  /** Flags, debug mode and the API environment. Leave it out while it loads. */
  data?: DeveloperSettings;
  /** "loading" shows skeletons; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Turn a flag on or off. The switch moves at once and moves back if this fails. Switches are read-only without it. */
  onSetFlag?: Action<SetFlagInput>;
  /** Turn debug mode on or off. Read-only without it. */
  onSetDebug?: Action<boolean>;
  /** The debug console's lines, newest last; shown while debug mode is on. */
  logLines?: DebugLogLine[];
  /** Point the client at another environment (receives its id). The choice is read-only without it, or when `data.canSwitchEnvironment` is false. */
  onSetEnvironment?: Action<string>;
  /** Where "API explorer" goes. Hidden when not given. */
  apiExplorerHref?: string;
  className?: string;
}

const STATUS_STYLE: Record<FlagStatus, string> = {
  stable: "border-category-2/20 bg-category-2/10 text-category-2-foreground",
  beta: "border-category-1/20 bg-category-1/10 text-category-1-foreground",
  experimental: "border-category-3/25 bg-category-3/10 text-category-3-foreground",
};
const LEVEL_TONE: Record<LogLevel, string> = {
  debug: "text-muted-foreground",
  info: "text-info-foreground",
  warn: "text-warning-foreground",
  error: "text-destructive-foreground",
};
/** Environment dots by position: production, staging, local, then the rest. */
const ENV_TONES = ["bg-category-2", "bg-category-1", "bg-category-3", "bg-category-5"];
const ENV_TEXT = ["text-category-2-foreground", "text-category-1-foreground", "text-category-3-foreground", "text-category-5-foreground"];
const SKELETON_ROWS = ["r1", "r2", "r3"];
const fieldError = "text-destructive-foreground text-xs";

function DeveloperLabsScreen({ data, status = "ready", error, onRetry, onSetFlag, onSetDebug, logLines = [], onSetEnvironment, apiExplorerHref, className }: DeveloperLabsProps) {
  const t = useMessages("developerLabs", DEVELOPER_LABS_MESSAGES);
  const format = useFormat();
  const id = useId();
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [debug, setDebug] = useState(false);
  const [env, setEnv] = useState("");
  useEffect(() => {
    if (!data) return;
    setFlags(Object.fromEntries(data.groups.flatMap((g) => g.flags.map((f) => [f.key, f.enabled]))));
    setDebug(data.debug);
    setEnv(data.environment);
  }, [data]);

  const setFlag = useAction(onSetFlag ?? (async () => {}), {
    optimistic: ({ key, enabled }) => {
      setFlags((all) => ({ ...all, [key]: enabled }));
      return () => setFlags((all) => ({ ...all, [key]: !enabled }));
    },
  });
  const setDebugMode = useAction(onSetDebug ?? (async () => {}), {
    optimistic: (on) => {
      setDebug(on);
      return () => setDebug(!on);
    },
  });
  const setEnvironment = useAction(onSetEnvironment ?? (async () => {}), {
    optimistic: (next) => {
      const before = env;
      setEnv(next);
      return () => setEnv(before);
    },
  });

  const ready = status === "ready" && data ? data : undefined;
  const values = Object.values(flags);
  const canSwitch = Boolean(onSetEnvironment && ready?.canSwitchEnvironment);
  const time = (iso: string) => format.time(iso, { hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3, hourCycle: "h23" });

  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
            <h1 className="mt-1 font-heading text-3xl">{t.title}</h1>
            <p className="mt-1.5 text-muted-foreground text-sm">{t.subtitle}</p>
          </div>
          {apiExplorerHref ? (
            <WirefrontLink className={buttonVariants({ size: "sm", variant: "outline" })} href={apiExplorerHref}>
              <TerminalIcon />
              {t.apiExplorer}
            </WirefrontLink>
          ) : null}
        </header>

        <Separator className="my-8" />

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
          <div aria-busy="true" className="flex flex-col gap-4">
            {SKELETON_ROWS.map((key) => (
              <Skeleton className="h-40 w-full rounded-xl motion-reduce:animate-none" key={key} />
            ))}
          </div>
        ) : (
          <>
            <section aria-labelledby={`${id}-flags`}>
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <h2 className="font-heading text-base" id={`${id}-flags`}>
                    {t.flags}
                  </h2>
                  <p className="mt-0.5 text-muted-foreground text-xs">{t.flagsHint}</p>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] tabular-nums">
                  {interpolate(t.flagsOn, { on: values.filter(Boolean).length, total: values.length })}
                </span>
              </div>
              {setFlag.error ? (
                <p className={cn(fieldError, "mt-3")} role="alert">
                  {setFlag.error}
                </p>
              ) : null}

              <div className="mt-5 flex flex-col gap-6">
                {ready.groups.map((group) => (
                  <div key={group.id}>
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{group.title}</h3>
                      <span aria-hidden className="h-px flex-1 bg-border/60" />
                      <span aria-hidden className="font-mono text-[10px] text-muted-foreground tabular-nums">
                        {group.flags.length}
                      </span>
                    </div>
                    <ul className="divide-y divide-border/50 rounded-xl border border-border/60 bg-background/40">
                      {group.flags.map((f) => {
                        const switchId = `${id}-${f.key}`;
                        return (
                          <li className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-foreground/2" key={f.key}>
                            <div className="min-w-0 flex-1">
                              {/* The label covers the text column too, so the whole row toggles the flag. */}
                              <label className="flex cursor-pointer flex-wrap items-center gap-2" htmlFor={switchId}>
                                <code className="font-mono text-[12px] text-foreground">{f.key}</code>{" "}
                                <Badge className={cn("h-4.5 rounded-sm px-1 font-mono text-[10px] uppercase tracking-[0.15em]", STATUS_STYLE[f.status])} variant="outline">
                                  {t[f.status]}
                                </Badge>
                              </label>
                              <p className="mt-0.5 text-muted-foreground text-xs">{f.description}</p>
                            </div>
                            <Switch
                              checked={Boolean(flags[f.key])}
                              className="shrink-0"
                              disabled={!onSetFlag || setFlag.isPending(f.key)}
                              id={switchId}
                              onCheckedChange={(on) => void setFlag.run({ key: f.key, enabled: on }, f.key)}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <Separator className="my-10" />

            <section aria-labelledby={`${id}-debug-title`}>
              <h2 className="font-heading text-base" id={`${id}-debug-title`}>
                {t.debug}
              </h2>
              <p className="mt-0.5 text-muted-foreground text-xs">{t.debugHint}</p>
              <div className="mt-4 flex items-center gap-4 rounded-xl border border-border/60 bg-background/40 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <label className="cursor-pointer font-medium text-sm" htmlFor={`${id}-debug`}>
                    {t.debug}
                  </label>
                  <p className="mt-0.5 text-muted-foreground text-xs">{t.debugDetail}</p>
                </div>
                <Switch checked={debug} className="shrink-0" disabled={!onSetDebug || setDebugMode.isPending()} id={`${id}-debug`} onCheckedChange={(on) => void setDebugMode.run(on)} />
              </div>
              {setDebugMode.error ? (
                <p className={cn(fieldError, "mt-3")} role="alert">
                  {setDebugMode.error}
                </p>
              ) : null}

              {debug ? (
                <div className="mt-3 overflow-hidden rounded-xl border border-border bg-foreground shadow-xs/5">
                  <div className="flex items-center justify-between border-border border-b bg-foreground/60 px-3 py-1.5">
                    <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                      <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-category-2 motion-reduce:animate-none" />
                      {t.console}
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{interpolate(t.lines, { count: logLines.length })}</span>
                  </div>
                  <ol aria-live="polite" className="max-h-72 overflow-auto px-3 py-2.5 font-mono text-[11px] text-muted-foreground leading-relaxed">
                    {logLines.length ? (
                      logLines.map((line) => (
                        <li className="flex gap-3 whitespace-pre" key={line.id}>
                          <time className="tabular-nums" dateTime={line.at}>
                            {time(line.at)}
                          </time>
                          <span className={cn("w-10 shrink-0 uppercase tracking-wider", LEVEL_TONE[line.level])}>{line.level}</span>
                          <span className="w-20 shrink-0">{line.channel}</span>
                          <span>{line.message}</span>
                        </li>
                      ))
                    ) : (
                      <li>{t.noLines}</li>
                    )}
                  </ol>
                </div>
              ) : null}
            </section>

            <Separator className="my-10" />

            <section aria-labelledby={`${id}-env`}>
              <h2 className="font-heading text-base" id={`${id}-env`}>
                {t.environment}
              </h2>
              <p className="mt-0.5 text-muted-foreground text-xs">{t.environmentHint}</p>
              <RadioGroup
                aria-labelledby={`${id}-env`}
                className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3"
                disabled={!canSwitch || setEnvironment.isPending()}
                onValueChange={(v) => void setEnvironment.run(v as string)}
                value={env}
              >
                {ready.environments.map((opt, i) => {
                  const optionId = `${id}-env-${opt.id}`;
                  return (
                    <div
                      className={cn(
                        "flex items-start gap-3 rounded-xl border bg-background/40 px-3.5 py-3 transition-colors",
                        env === opt.id ? "border-foreground/40 bg-foreground/3" : "border-border/60 hover:border-foreground/20",
                      )}
                      key={opt.id}
                    >
                      <RadioGroupItem className="mt-0.5" id={optionId} value={opt.id} />
                      <label className={cn("min-w-0 flex-1", canSwitch && "cursor-pointer")} htmlFor={optionId}>
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm">{opt.label}</span>
                          <span aria-hidden className={cn("size-1.5 rounded-full", ENV_TONES[i % ENV_TONES.length])} />
                        </span>
                        <code className={cn("mt-0.5 block truncate font-mono text-[11px]", ENV_TEXT[i % ENV_TEXT.length])}>{opt.host}</code>
                      </label>
                    </div>
                  );
                })}
              </RadioGroup>
              {setEnvironment.error ? (
                <p className={cn(fieldError, "mt-3")} role="alert">
                  {setEnvironment.error}
                </p>
              ) : null}
              {!ready.canSwitchEnvironment ? <p className="mt-3 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{t.adminOnly}</p> : null}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export function DeveloperLabs(props: DeveloperLabsProps) {
  return (
    <ScreenBoundary name="DeveloperLabs">
      <DeveloperLabsScreen {...props} />
    </ScreenBoundary>
  );
}
