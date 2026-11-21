// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Button, buttonVariants } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { CheckIcon, ExternalLinkIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import type { Integration } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("integrationDirectory.<key>"). */
export const INTEGRATION_DIRECTORY_MESSAGES = {
  eyebrow: "Settings · Integrations",
  title: "Integrations",
  summary: "{connected} connected · {available} more available",
  search: "Find an integration",
  category: "Category",
  all: "All",
  connectedFilter: "Connected",
  on: "On",
  connect: "Connect",
  configure: "Configure",
  docs: "Open {name} docs",
  noMatch: "Nothing matches “{query}”.",
  none: "No integrations yet.",
  errorTitle: "Couldn’t load integrations",
  retry: "Try again",
};

export interface IntegrationDirectoryProps {
  /** Every integration. Leave it out while they load. */
  integrations?: Integration[];
  /** "loading" shows skeletons; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Start connecting one (receives its id). Usually redirects to an OAuth page. Connect buttons only show with this. */
  onConnect?: Action<string>;
  className?: string;
}

/** Monogram colours, picked by name so a tile keeps its colour. */
const TONES = ["bg-foreground text-background", "bg-category-5-strong text-white", "bg-category-4-strong text-white", "bg-category-8-strong text-white", "bg-category-3-strong text-white"];
const SKELETON_CARDS = ["c1", "c2", "c3", "c4", "c5", "c6"];
const ALL = "__all";
const CONNECTED = "__connected";

function tone(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

function IntegrationDirectoryScreen({ integrations, status = "ready", error, onRetry, onConnect, className }: IntegrationDirectoryProps) {
  const t = useMessages("integrationDirectory", INTEGRATION_DIRECTORY_MESSAGES);
  const [filter, setFilter] = useState(ALL);
  const [query, setQuery] = useState("");
  const connect = useAction(onConnect ?? (async () => {}));
  const list = integrations ?? [];
  const categories = [...new Set(list.map((i) => i.category))];
  const connected = list.filter((i) => i.connected).length;
  const q = query.trim().toLowerCase();
  const visible = list.filter((i) => {
    if (q && !i.name.toLowerCase().includes(q)) return false;
    if (filter === ALL) return true;
    if (filter === CONNECTED) return i.connected;
    return i.category === filter;
  });
  const ready = status === "ready" && integrations;
  const options = [
    { value: ALL, label: t.all },
    { value: CONNECTED, label: t.connectedFilter },
    ...categories.map((c) => ({ value: c, label: c })),
  ];

  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
        <h1 className="mt-1 font-heading text-3xl">{t.title}</h1>
        {ready ? <p className="mt-1.5 text-muted-foreground text-sm">{interpolate(t.summary, { connected, available: list.length - connected })}</p> : null}

        {status === "error" ? (
          <div className="mt-8 rounded-xl border border-border/60 p-10 text-center">
            <p className="font-medium">{t.errorTitle}</p>
            {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
            {onRetry ? (
              <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                {t.retry}
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2 rounded-md border border-border/70 bg-background/40 px-3 focus-within:ring-2 focus-within:ring-ring">
                <SearchIcon aria-hidden className="size-3.5 opacity-50" />
                <input
                  aria-label={t.search}
                  className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground pointer-coarse:h-11"
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.search}
                  type="search"
                  value={query}
                />
              </div>
              <RadioGroup aria-label={t.category} className="flex flex-wrap gap-1.5" onValueChange={(v) => setFilter(v as string)} value={filter}>
                {options.map((o) => (
                  <Radio.Root
                    className="min-h-7 cursor-pointer rounded-md border border-border/60 px-2.5 py-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-checked:border-transparent data-checked:bg-foreground data-checked:text-background pointer-coarse:min-h-10"
                    key={o.value}
                    value={o.value}
                  >
                    {o.label}
                  </Radio.Root>
                ))}
              </RadioGroup>
            </div>

            {connect.error ? (
              <p className="mt-4 text-destructive-foreground text-sm" role="alert">
                {connect.error}
              </p>
            ) : null}

            <ul aria-busy={status === "loading"} className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ready
                ? visible.map((i) => (
                    <li className="group flex flex-col gap-3 rounded-xl border border-border/60 bg-background/40 p-4 transition-colors hover:border-foreground/30" key={i.id}>
                      <div className="flex items-start justify-between">
                        {i.logoUrl ? (
                          <img alt="" className="size-10 rounded-lg object-cover" height={40} src={i.logoUrl} width={40} />
                        ) : (
                          <div aria-hidden className={cn("flex size-10 items-center justify-center rounded-lg font-medium text-[12px]", tone(i.name))}>
                            {i.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        {i.badge ? <span className="rounded bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{i.badge}</span> : null}
                      </div>
                      <div>
                        <h2 className="flex items-center gap-2">
                          <span className="font-medium">{i.name}</span>
                          {i.connected ? (
                            <span className="inline-flex items-center gap-1 rounded bg-category-2/10 px-1.5 py-0.5 font-mono text-[10px] text-category-2-foreground uppercase tracking-[0.2em]">
                              <CheckIcon aria-hidden className="size-2.5" />
                              {t.on}
                            </span>
                          ) : null}
                        </h2>
                        <div className="mt-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{i.category}</div>
                        <p className="mt-2 text-muted-foreground text-xs leading-relaxed">{i.description}</p>
                      </div>
                      <div className="mt-auto flex items-center gap-2 pt-1">
                        {i.connected && i.configureHref ? (
                          <WirefrontLink className={cn(buttonVariants({ size: "sm", variant: "outline" }), "flex-1")} href={i.configureHref}>
                            {t.configure} <span className="sr-only">{i.name}</span>
                          </WirefrontLink>
                        ) : !i.connected && onConnect ? (
                          <Button aria-busy={connect.isPending(i.id)} className="flex-1" disabled={connect.isPending()} onClick={() => void connect.run(i.id, i.id)} size="sm" type="button">
                            {connect.isPending(i.id) ? <Spinner data-icon="inline-start" /> : null}
                            {t.connect} <span className="sr-only">{i.name}</span>
                          </Button>
                        ) : (
                          <span className="flex-1" />
                        )}
                        {i.docsUrl ? (
                          <WirefrontLink
                            aria-label={interpolate(t.docs, { name: i.name })}
                            className="inline-flex shrink-0 items-center justify-center rounded-md border border-border/60 bg-background/40 p-2 text-muted-foreground transition-colors hover:text-foreground pointer-coarse:size-10"
                            href={i.docsUrl}
                          >
                            <ExternalLinkIcon aria-hidden className="size-3.5" />
                          </WirefrontLink>
                        ) : null}
                      </div>
                    </li>
                  ))
                : SKELETON_CARDS.map((key) => (
                    <li key={key}>
                      <Skeleton className="h-48 w-full rounded-xl motion-reduce:animate-none" />
                    </li>
                  ))}
            </ul>

            {ready && visible.length === 0 ? (
              <div className="mt-8 rounded-xl border border-border/70 border-dashed bg-background/30 px-6 py-12 text-center">
                <p className="text-muted-foreground text-sm">{q ? interpolate(t.noMatch, { query }) : t.none}</p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export function IntegrationDirectory(props: IntegrationDirectoryProps) {
  return (
    <ScreenBoundary name="IntegrationDirectory">
      <IntegrationDirectoryScreen {...props} />
    </ScreenBoundary>
  );
}
