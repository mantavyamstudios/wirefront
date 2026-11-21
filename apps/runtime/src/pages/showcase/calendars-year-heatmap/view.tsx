// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { Input } from "@wirefront/ui/input";
import { Skeleton } from "@wirefront/ui/skeleton";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import { ScrollRegion } from "@wirefront/ui/wirefront/scroll-region";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { cn } from "@wirefront/ui/lib/utils";
import { useEffect, useRef, useState } from "react";
import type { ContributionYear } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("contributionHeatmap.<key>"). */
export const CONTRIBUTION_HEATMAP_MESSAGES = {
  eyebrow: "Contributions · last 12 months",
  username: "Username",
  usernamePlaceholder: "username",
  load: "Load",
  loading: "Loading…",
  repos: "repos",
  followers: "followers",
  total: "{count} contributions",
  streaks: "· active {active} days · longest {longest} days · current {current} days",
  calendar: "Contribution calendar",
  calendarLabel: "{count} contributions over {days} days",
  hint: "Point at or tap a day to see it",
  day: "{count} on {date}",
  less: "Less",
  more: "More",
  mostActive: "Most active day",
  contributions: "{count} contributions",
  average: "Avg / day",
  acrossYear: "across the year",
  longestBreak: "Longest break",
  days: "{count} days",
  none: "—",
  recent: "Recent commits",
  noCommits: "No recent commits.",
  errorTitle: "Couldn’t load contributions",
  retry: "Try again",
};

export interface ContributionHeatmapProps {
  /** The profile, daily counts and recent commits. Leave it out while it loads. */
  data?: ContributionYear;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Load another user by login. The search form is hidden without it. */
  onSearch?: Action<string>;
  className?: string;
}

const LEVELS = ["rgba(127, 127, 127, 0.08)", "rgba(20, 184, 166, 0.28)", "rgba(20, 184, 166, 0.5)", "rgba(20, 184, 166, 0.75)", "rgba(20, 184, 166, 0.96)"];
const utc = (d: string) => new Date(`${d}T00:00:00Z`);

function stats(days: ContributionYear["days"], today: string) {
  const past = days.filter((d) => d.date <= today);
  let longest = 0;
  let run = 0;
  let brk = { length: 0, start: "", end: "" };
  let breakStart = "";
  let breakRun = 0;
  for (const d of past) {
    if (d.count > 0) {
      run += 1;
      longest = Math.max(longest, run);
      breakRun = 0;
    } else {
      run = 0;
      if (breakRun === 0) breakStart = d.date;
      breakRun += 1;
      if (breakRun > brk.length) brk = { length: breakRun, start: breakStart, end: d.date };
    }
  }
  let current = 0;
  for (let i = past.length - 1; i >= 0; i--) {
    if ((past[i]?.count ?? 0) > 0) current += 1;
    // Today may still be empty without breaking the streak.
    else if (i !== past.length - 1) break;
  }
  const most = days.reduce<ContributionYear["days"][number] | undefined>((best, d) => (!best || d.count > best.count ? d : best), undefined);
  const total = days.reduce((sum, d) => sum + d.count, 0);
  return { total, active: days.filter((d) => d.count > 0).length, longest, current, brk, most, avg: days.length ? total / days.length : 0 };
}

function ContributionHeatmapScreen({ data, status = "ready", error, onRetry, onSearch, className }: ContributionHeatmapProps) {
  const t = useMessages("contributionHeatmap", CONTRIBUTION_HEATMAP_MESSAGES);
  const fmt = useFormat();
  const { now, timeZone } = useWirefront();
  const [query, setQuery] = useState(data?.profile.login ?? "");
  const [active, setActive] = useState<string>();
  const search = useAction(onSearch ?? (async () => {}));
  const gridRef = useRef<HTMLDivElement>(null);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now());
  const days = data?.days ?? [];
  const byDate = new Map(days.map((d) => [d.date, d.count]));
  const max = Math.max(1, ...days.map((d) => d.count));
  const level = (count: number) => (count === 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4)));
  const long = (d: string) => fmt.date(utc(d), { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  const short = (d: string) => fmt.date(utc(d), { month: "short", day: "numeric", timeZone: "UTC" });
  const s = stats(days, today);

  // Weeks run Sunday to Saturday; the first week is padded so weekdays line up.
  const firstDate = days[0]?.date;
  const lead = firstDate ? utc(firstDate).getUTCDay() : 0;
  const slots = [...Array.from({ length: lead }, (_, n) => ({ key: `pad-${n}`, date: undefined as string | undefined })), ...days.map((d) => ({ key: d.date, date: d.date as string | undefined }))];
  const weeks = Array.from({ length: Math.ceil(slots.length / 7) }, (_, w) => ({ key: slots[w * 7]?.key ?? `w-${w}`, cells: slots.slice(w * 7, w * 7 + 7) }));
  const monthLabels = weeks.flatMap((w, wi) => {
    const d = w.cells.find((c) => c.date)?.date;
    const prev = weeks[wi - 1]?.cells.find((c) => c.date)?.date;
    return d && (!prev || d.slice(0, 7) !== prev.slice(0, 7)) ? [{ key: d, week: wi, label: fmt.date(utc(d), { month: "short", timeZone: "UTC" }) }] : [];
  });
  const weekdayLabels = [1, 3, 5].map((dow) => ({ dow, label: fmt.date(new Date(Date.UTC(2026, 1, 1 + dow)), { weekday: "short", timeZone: "UTC" }) }));

  // On narrow screens start the grid at the most recent weeks.
  useEffect(() => {
    const viewport = gridRef.current?.closest<HTMLElement>("[data-slot=scroll-region] > div");
    if (viewport && days.length) viewport.scrollLeft = viewport.scrollWidth;
  }, [days.length]);
  // Point at (mouse) or tap (touch) a day to read it in the footer.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const pick = (e: Event) => {
      const date = (e.target as HTMLElement).dataset.date;
      if (date) setActive(date);
    };
    grid.addEventListener("pointerover", pick);
    grid.addEventListener("click", pick);
    return () => {
      grid.removeEventListener("pointerover", pick);
      grid.removeEventListener("click", pick);
    };
  }, []);

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-5xl">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
        {onSearch ? (
          <form
            className="mt-3 flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const next = query.trim();
              if (next) void search.run(next);
            }}
          >
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <span aria-hidden className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <Input aria-label={t.username} autoComplete="off" className="ps-7" onChange={(e) => setQuery(e.target.value)} placeholder={t.usernamePlaceholder} spellCheck={false} value={query} />
            </div>
            <Button className="shrink-0" disabled={search.isPending()} type="submit" variant="outline">
              {search.isPending() ? t.loading : t.load}
            </Button>
          </form>
        ) : null}
        {search.error ? (
          <p className="mt-2 text-destructive-foreground text-sm" role="alert">
            {search.error}
          </p>
        ) : null}

        {status === "error" ? (
          <div className="mt-6 rounded-xl border border-border/60 py-12 text-center">
            <p className="font-medium">{t.errorTitle}</p>
            {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
            {onRetry ? (
              <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                {t.retry}
              </Button>
            ) : null}
          </div>
        ) : !data || status === "loading" ? (
          <div aria-busy="true" className="mt-6 flex flex-col gap-4">
            <Skeleton className="h-14 w-64 motion-reduce:animate-none" />
            <Skeleton className="h-40 w-full rounded-xl motion-reduce:animate-none" />
            <Skeleton className="h-48 w-full rounded-xl motion-reduce:animate-none" />
          </div>
        ) : (
          <>
            <div className="mt-6 flex items-start gap-4">
              <Avatar aria-hidden className="size-12 shrink-0 sm:size-14">
                {data.profile.avatarUrl ? <AvatarImage alt="" src={data.profile.avatarUrl} /> : null}
                <AvatarFallback>{data.profile.login.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="break-words font-heading text-2xl">{data.profile.name ?? data.profile.login}</h1>
                {data.profile.href ? (
                  <WirefrontLink className="text-muted-foreground text-sm hover:text-foreground" href={data.profile.href}>
                    @{data.profile.login}
                  </WirefrontLink>
                ) : (
                  <span className="text-muted-foreground text-sm">@{data.profile.login}</span>
                )}
                {data.profile.bio ? <p className="mt-2 text-foreground/80 text-sm">{data.profile.bio}</p> : null}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                  <span>
                    <span className="text-foreground">{fmt.number(data.profile.repos)}</span> {t.repos}
                  </span>
                  <span>
                    <span className="text-foreground">{fmt.number(data.profile.followers)}</span> {t.followers}
                  </span>
                </div>
              </div>
            </div>

            <h2 className="mt-6 font-heading text-xl">
              {interpolate(t.total, { count: fmt.number(s.total) })}
              <span className="block font-sans text-muted-foreground text-sm sm:ms-2 sm:inline">{interpolate(t.streaks, { active: s.active, longest: s.longest, current: s.current })}</span>
            </h2>

            <div className="mt-4 rounded-xl border border-border/60 bg-background/40 p-4 sm:p-5">
              <ScrollRegion aria-label={t.calendar} className="pb-1" orientation="horizontal">
                <div aria-label={interpolate(t.calendarLabel, { count: fmt.number(s.total), days: days.length })} className="grid w-max grid-cols-[28px_auto] gap-2" ref={gridRef} role="img">
                  <div className="flex flex-col gap-[3px] pt-5">
                    {[0, 1, 2, 3, 4, 5, 6].map((dow) => (
                      <span className="flex h-3 items-center font-mono text-[10px] text-muted-foreground" key={dow}>
                        {weekdayLabels.find((w) => w.dow === dow)?.label ?? ""}
                      </span>
                    ))}
                  </div>
                  <div>
                    <div className="relative h-4">
                      {monthLabels.map((m) => (
                        <span className="absolute font-mono text-[10px] text-muted-foreground" key={m.key} style={{ insetInlineStart: m.week * 15 }}>
                          {m.label}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1 flex gap-[3px]">
                      {weeks.map((w) => (
                        <div className="flex flex-col gap-[3px]" key={w.key}>
                          {w.cells.map((c) =>
                            c.date ? (
                              <span className="size-3 rounded-sm" data-date={c.date} key={c.key} style={{ backgroundColor: LEVELS[level(byDate.get(c.date) ?? 0)] }} title={interpolate(t.day, { count: byDate.get(c.date) ?? 0, date: long(c.date) })} />
                            ) : (
                              <span className="size-3" key={c.key} />
                            ),
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollRegion>
              <div className="mt-4 flex flex-col gap-3 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] sm:flex-row sm:items-center sm:justify-between sm:tracking-[0.25em]">
                <span aria-live="polite" className="min-h-4">
                  {active ? <span className="text-foreground">{interpolate(t.day, { count: byDate.get(active) ?? 0, date: long(active) })}</span> : t.hint}
                </span>
                <div aria-hidden className="flex items-center gap-2">
                  <span>{t.less}</span>
                  <div className="flex gap-[3px]">
                    {LEVELS.map((color) => (
                      <span className="size-3 rounded-sm" key={color} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <span>{t.more}</span>
                </div>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 [&>*:last-child]:max-sm:col-span-2">
              {[
                { key: "most", label: t.mostActive, value: s.most ? short(s.most.date) : t.none, sub: s.most ? interpolate(t.contributions, { count: s.most.count }) : "" },
                { key: "avg", label: t.average, value: fmt.number(s.avg, { maximumFractionDigits: 1, minimumFractionDigits: 1 }), sub: t.acrossYear },
                { key: "break", label: t.longestBreak, value: interpolate(t.days, { count: s.brk.length }), sub: s.brk.length ? `${short(s.brk.start)} – ${short(s.brk.end)}` : "" },
              ].map((stat) => (
                <div className="rounded-xl border border-border/60 bg-background/40 p-4" key={stat.key}>
                  <dt className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{stat.label}</dt>
                  <dd className="mt-1 font-heading text-2xl tracking-tight">{stat.value}</dd>
                  <dd className="mt-0.5 text-muted-foreground text-xs">{stat.sub}</dd>
                </div>
              ))}
            </dl>

            <section aria-labelledby="heatmap-recent" className="mt-8">
              <h2 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]" id="heatmap-recent">
                {t.recent}
              </h2>
              {data.commits.length === 0 ? (
                <p className="mt-3 rounded-xl border border-border/60 px-4 py-6 text-center text-muted-foreground text-sm">{t.noCommits}</p>
              ) : (
                <ul className="mt-3 divide-y divide-border/60 rounded-xl border border-border/60 bg-background/40">
                  {data.commits.slice(0, 8).map((c) => {
                    const body = (
                      <>
                        <span className="block truncate text-sm">{c.message.split("\n")[0]}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                          <span className="text-foreground">{c.repo}</span>
                          <span aria-hidden>·</span>
                          <span>{c.sha.slice(0, 7)}</span>
                          <span aria-hidden>·</span>
                          <time dateTime={c.at}>{fmt.relative(c.at)}</time>
                        </span>
                      </>
                    );
                    return (
                      <li key={c.sha}>
                        {c.href ? (
                          <WirefrontLink className="block px-4 py-3 outline-none transition-colors hover:bg-foreground/[0.02] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset" href={c.href}>
                            {body}
                          </WirefrontLink>
                        ) : (
                          <div className="px-4 py-3">{body}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export function ContributionHeatmap(props: ContributionHeatmapProps) {
  return (
    <ScreenBoundary name="ContributionHeatmap">
      <ContributionHeatmapScreen {...props} />
    </ScreenBoundary>
  );
}
