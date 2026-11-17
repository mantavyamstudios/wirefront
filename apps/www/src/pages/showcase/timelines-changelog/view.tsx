// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import { CalendarIcon, RssIcon, SparklesIcon } from "lucide-react";
import type { ChangeGroup, ChangelogEntry } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("changelogFeed.<key>"). */
export const CHANGELOG_FEED_MESSAGES = {
  eyebrow: "Changelog",
  title: "What’s new in {product}",
  subscribe: "Subscribe",
  latest: "Latest",
  new: "New",
  improved: "Improved",
  fixed: "Fixed",
  removed: "Removed",
  empty: "No releases yet.",
  errorTitle: "Couldn’t load the changelog",
  retry: "Try again",
};

export interface ChangelogFeedProps {
  /** Releases, newest first. Leave it out while they load. */
  entries?: ChangelogEntry[];
  /** Your product's name, for the title. */
  product: string;
  /** Where "Subscribe" goes, e.g. an RSS feed. Hidden when not given. */
  subscribeHref?: string;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

const TONE: Record<ChangeGroup["kind"], string> = {
  new: "bg-category-2/12 text-category-2-foreground",
  improved: "bg-category-8/12 text-category-8-foreground",
  fixed: "bg-category-3/12 text-category-3-foreground",
  removed: "bg-category-4/12 text-category-4-foreground",
};

function ChangelogFeedScreen({ entries, product, subscribeHref, status = "ready", error, onRetry, className }: ChangelogFeedProps) {
  const t = useMessages("changelogFeed", CHANGELOG_FEED_MESSAGES);
  const fmt = useFormat();

  return (
    <div className={cn("min-h-svh bg-background px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12", className)}>
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
            <h1 className="mt-1 font-heading text-3xl tracking-tight">{interpolate(t.title, { product })}</h1>
          </div>
          {subscribeHref ? (
            <WirefrontLink
              className="inline-flex min-h-9 items-center gap-2 self-start rounded-md border border-border/60 bg-background/40 px-3 py-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              href={subscribeHref}
            >
              <RssIcon aria-hidden className="size-3" />
              {t.subscribe}
            </WirefrontLink>
          ) : null}
        </div>

        {status === "error" ? (
          <div className="mt-10 rounded-xl border border-border/60 py-12 text-center">
            <p className="font-medium">{t.errorTitle}</p>
            {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
            {onRetry ? (
              <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                {t.retry}
              </Button>
            ) : null}
          </div>
        ) : !entries || status === "loading" ? (
          <div aria-busy="true" className="mt-10 flex flex-col gap-6">
            <Skeleton className="aspect-[16/7] w-full rounded-xl motion-reduce:animate-none" />
            <Skeleton className="h-40 w-full motion-reduce:animate-none" />
          </div>
        ) : entries.length === 0 ? (
          <p className="mt-10 rounded-xl border border-border/60 py-12 text-center text-muted-foreground text-sm">{t.empty}</p>
        ) : (
          <div className="mt-6 flex flex-col sm:mt-10">
            {entries.map((r, i) => (
              <article
                aria-labelledby={`release-${r.version}`}
                // Below md the date/version aside becomes a header above each entry,
                // so the release notes get the full width.
                className="grid grid-cols-1 gap-4 border-border/40 border-b py-8 last:border-b-0 md:grid-cols-[140px_minmax(0,1fr)] md:gap-8 md:py-10"
                key={r.version}
              >
                <header className="flex flex-wrap items-center gap-x-3 gap-y-1 md:sticky md:top-8 md:block md:self-start">
                  <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                    <CalendarIcon aria-hidden className="size-3" />
                    <time dateTime={r.date}>{fmt.date(`${r.date}T00:00:00Z`, { dateStyle: "medium", timeZone: "UTC" })}</time>
                  </div>
                  <div className="flex items-center gap-2 md:mt-1">
                    <h2 className="font-heading text-xl tracking-tight" id={`release-${r.version}`}>
                      {r.version}
                    </h2>
                    {i === 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 font-mono text-[10px] text-background uppercase tracking-[0.2em]">
                        <SparklesIcon aria-hidden className="size-2.5" />
                        {t.latest}
                      </span>
                    ) : null}
                  </div>
                </header>

                <div>
                  {i === 0 && r.headline ? (
                    <div className="mb-5 aspect-[16/7] w-full overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-category-8/10 via-foreground/[0.04] to-category-6/10">
                      <div className="grid h-full place-items-center">
                        <div className="text-center">
                          <SparklesIcon aria-hidden className="mx-auto size-6 opacity-50" />
                          <p className="mt-2 px-4 font-heading text-base sm:text-lg">{r.headline}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {r.groups.map((g) => (
                    <section className="mt-5 first:mt-0" key={g.kind}>
                      <h3 className={cn("inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em]", TONE[g.kind])}>{t[g.kind]}</h3>
                      <ul className="mt-2 space-y-1.5">
                        {g.items.map((it) => (
                          <li className="flex gap-2 text-foreground/85 text-sm leading-relaxed" key={it}>
                            <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
                            {it}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChangelogFeed(props: ChangelogFeedProps) {
  return (
    <ScreenBoundary name="ChangelogFeed">
      <ChangelogFeedScreen {...props} />
    </ScreenBoundary>
  );
}
