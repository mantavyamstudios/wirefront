// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Badge } from "@wirefront/ui/badge";
import { buttonVariants } from "@wirefront/ui/button";
import { Card, CardContent } from "@wirefront/ui/card";
import { cn } from "@wirefront/ui/lib/utils";
import { Switch } from "@wirefront/ui/switch";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
  WirefrontLink,
} from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { CheckCircle2Icon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";

import type {
  ConnectedService,
  IntegrationHealth,
  ToggleServiceInput,
} from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("connectedServices.<key>"). */
export const CONNECTED_SERVICES_MESSAGES = {
  title: "Connected services",
  summary: "{connected} connected · {attention} need attention",
  summaryOne: "{connected} connected · 1 needs attention",
  summaryOk: "{connected} connected",
  browse: "Browse all",
  ok: "Healthy",
  warn: "Degraded",
  error: "Failing",
  off: "Disconnected",
  synced: "synced {when}",
  neverSynced: "Not synced yet",
  notConnected: "Not connected",
  enable: "{name}",
  configure: "Configure",
  configureName: "Configure {name}",
};

export interface ConnectedServicesProps {
  services: ConnectedService[];
  /** Turn one on or off (setServiceEnabled). Applied at once and rolled back if it fails. Switches hide without it. */
  onToggle?: Action<ToggleServiceInput>;
  /** Where "Configure" goes for each. Hidden when not given. */
  configureHref?: (service: ConnectedService) => string;
  /** Where "Browse all" goes. Hidden when not given. */
  browseHref?: string;
  className?: string;
}

const DOT: Record<IntegrationHealth | "off", string> = {
  ok: "bg-category-2",
  warn: "bg-warning",
  error: "bg-destructive",
  off: "bg-muted-foreground/40",
};
const TONES = [
  "from-category-2/20 to-category-6/10",
  "from-muted-foreground/20 to-muted-foreground/5",
  "from-category-5/20 to-category-5/10",
  "from-category-1/20 to-category-3/10",
];

function ConnectedServicesScreen({
  services,
  onToggle,
  configureHref,
  browseHref,
  className,
}: ConnectedServicesProps) {
  const t = useMessages("connectedServices", CONNECTED_SERVICES_MESSAGES);
  const format = useFormat();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const toggle = useAction(onToggle ?? (async () => {}), {
    optimistic: ({ id, enabled: on }) => {
      setEnabled((e) => ({ ...e, [id]: on }));
      return () => setEnabled((e) => ({ ...e, [id]: !on }));
    },
  });
  const isOn = (s: ConnectedService) => enabled[s.id] ?? s.enabled;
  const connected = services.filter(isOn).length;
  const attention = services.filter((s) => isOn(s) && s.health !== "ok").length;

  return (
    <div
      className={cn(
        "min-h-svh bg-background px-4 py-8 sm:px-6 sm:py-12",
        className
      )}
    >
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-xl">{t.title}</h1>
            <p className="text-muted-foreground text-sm">
              {interpolate(
                attention === 0
                  ? t.summaryOk
                  : attention === 1
                    ? t.summaryOne
                    : t.summary,
                { connected, attention }
              )}
            </p>
          </div>
          {browseHref ? (
            <WirefrontLink
              className={buttonVariants({ size: "sm", variant: "outline" })}
              href={browseHref}
            >
              {t.browse}
            </WirefrontLink>
          ) : null}
        </header>
        {toggle.error ? (
          <p className="mb-3 text-destructive-foreground text-sm" role="alert">
            {toggle.error}
          </p>
        ) : null}

        <ul className="flex flex-col gap-3">
          {services.map((s, i) => {
            const on = isOn(s);
            const status = on ? s.health : "off";
            const line = !on
              ? t.notConnected
              : (s.note ??
                (s.lastSyncAt
                  ? interpolate(t.synced, {
                      when: format.relative(s.lastSyncAt),
                    })
                  : t.neverSynced));
            return (
              <li key={s.id}>
                <Card className="overflow-hidden">
                  <CardContent className="flex items-start gap-3 p-3 sm:items-center sm:gap-4 sm:p-4">
                    {s.iconUrl ? (
                      <img
                        alt=""
                        className="size-10 shrink-0 rounded-xl border object-cover sm:size-11"
                        src={s.iconUrl}
                      />
                    ) : (
                      <div
                        aria-hidden
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-xl border bg-linear-to-br font-heading font-semibold text-base sm:size-11",
                          TONES[i % TONES.length]
                        )}
                      >
                        {s.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h2 className="font-heading font-semibold text-base">
                          {s.name}
                        </h2>
                        <Badge
                          className="gap-1.5 font-mono text-[10px] uppercase"
                          variant="outline"
                        >
                          <span
                            aria-hidden
                            className={cn("size-1.5 rounded-full", DOT[status])}
                          />
                          {t[status]}
                        </Badge>
                      </div>
                      <p className="line-clamp-2 text-muted-foreground text-sm sm:line-clamp-1">
                        {s.blurb}
                      </p>
                      {on && s.scopes.length ? (
                        <ul className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {s.scopes.map((scope) => (
                            <li
                              className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                              key={scope}
                            >
                              {scope}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <div className="mt-2 inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                        {status === "ok" ? (
                          <CheckCircle2Icon
                            aria-hidden
                            className="size-3 text-category-2-foreground"
                          />
                        ) : null}
                        {line}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {onToggle ? (
                        <Switch
                          aria-label={interpolate(t.enable, { name: s.name })}
                          checked={on}
                          disabled={toggle.isPending(s.id)}
                          onCheckedChange={(next) =>
                            void toggle.run({ id: s.id, enabled: next }, s.id)
                          }
                        />
                      ) : null}
                      {configureHref ? (
                        <WirefrontLink
                          aria-label={interpolate(t.configureName, {
                            name: s.name,
                          })}
                          className={cn(
                            buttonVariants({ size: "xs", variant: "ghost" }),
                            "text-muted-foreground"
                          )}
                          href={configureHref(s)}
                        >
                          <span aria-hidden className="max-sm:hidden">
                            {t.configure}
                          </span>
                          <ChevronRightIcon className="rtl:rotate-180" />
                        </WirefrontLink>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function ConnectedServices(props: ConnectedServicesProps) {
  return (
    <ScreenBoundary name="ConnectedServices">
      <ConnectedServicesScreen {...props} />
    </ScreenBoundary>
  );
}
