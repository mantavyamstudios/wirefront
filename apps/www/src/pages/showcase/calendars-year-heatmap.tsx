import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@orbit/ui/avatar";
import { Button } from "@orbit/ui/button";
import { Input } from "@orbit/ui/input";
import { Skeleton } from "@orbit/ui/skeleton";

const DEFAULT_USERNAME = "sean-brydon";

type Day = {
  date: string;
  contributionCount: number;
  contributionLevel:
    | "NONE"
    | "FIRST_QUARTILE"
    | "SECOND_QUARTILE"
    | "THIRD_QUARTILE"
    | "FOURTH_QUARTILE";
};

type Contributions = {
  contributions: Day[][];
  totalContributions: number;
};

type Profile = {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  html_url: string;
};

type GhCommit = { sha: string; message: string; url: string };

type GhEvent = {
  id: string;
  type: string;
  created_at: string;
  repo: { name: string };
  payload: {
    commits?: GhCommit[];
    ref?: string;
    ref_type?: string;
    action?: string;
    pull_request?: { title: string; number: number; html_url: string };
    issue?: { title: string; number: number; html_url: string };
  };
};

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const WEEKDAY_LABELS = ["Mon", "Wed", "Fri"];

// ── Sample data ──────────────────────────────────────────────────────────────
// The screen renders a deterministic, seeded year by default so it works
// offline, during SSR and without GitHub's 60 req/h unauthenticated limit.
// Loading a username opts in to the live APIs. In an app, pass real data in
// from a loader instead.
const SAMPLE_END = Date.UTC(2026, 8, 26); // Sat, Sep 26 2026
const DAY_MS = 86_400_000;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleData(login: string): {
  contributions: Contributions;
  profile: Profile;
  events: GhEvent[];
} {
  let h = 0;
  for (const ch of login) h = (h * 31 + ch.charCodeAt(0)) | 0;
  const rand = mulberry32(h);
  const levels: Day["contributionLevel"][] = [
    "NONE",
    "FIRST_QUARTILE",
    "SECOND_QUARTILE",
    "THIRD_QUARTILE",
    "FOURTH_QUARTILE",
  ];
  const start = SAMPLE_END - (52 * 7 + 6) * DAY_MS; // a Sunday, 53 weeks back
  const weeks: Day[][] = [];
  let total = 0;
  for (let w = 0; w < 53; w++) {
    const week: Day[] = [];
    for (let d = 0; d < 7; d++) {
      const t = start + (w * 7 + d) * DAY_MS;
      const weekend = d === 0 || d === 6;
      const r = rand();
      const count =
        r < (weekend ? 0.6 : 0.18) ? 0 : Math.round(rand() * (weekend ? 4 : 14));
      total += count;
      week.push({
        date: new Date(t).toISOString().slice(0, 10),
        contributionCount: count,
        contributionLevel: levels[count === 0 ? 0 : Math.min(4, Math.ceil(count / 3.5))]!,
      });
    }
    weeks.push(week);
  }
  const repos = ["acme/web", "acme/api", "orbit/ui"];
  const messages = [
    "fix(table): keep sticky column opaque",
    "feat(audit): persist 1y retention",
    "chore: bump @orbit/ui",
    "refactor(calendar): single scroll container",
    "docs: responsive audit notes",
    "test(api): cover rate-limit headers",
  ];
  const events: GhEvent[] = messages.map((m, i) => ({
    id: String(i),
    type: "PushEvent",
    created_at: new Date(SAMPLE_END + 12 * 3_600_000 - (i * 7 + 2) * 3_600_000).toISOString(),
    repo: { name: repos[i % repos.length]! },
    payload: {
      commits: [
        {
          sha: Math.floor(rand() * 0xffffffff).toString(16).padStart(8, "0") + "c0ffee",
          message: m,
          url: "",
        },
      ],
    },
  }));
  return {
    contributions: { contributions: weeks, totalContributions: total },
    profile: {
      login,
      name: "Sample developer",
      avatar_url: "",
      bio: "Seeded sample data — load a GitHub username to fetch live contributions.",
      public_repos: 42,
      followers: 318,
      html_url: `https://github.com/${login}`,
    },
    events,
  };
}

export function CalendarsYearHeatmapShowcasePage() {
  const sample = useMemo(() => sampleData(DEFAULT_USERNAME), []);
  const [input, setInput] = useState(DEFAULT_USERNAME);
  // null = show the seeded sample; a string = fetch that user live.
  const [username, setUsername] = useState<string | null>(null);
  const [data, setData] = useState<Contributions | null>(sample.contributions);
  const [profile, setProfile] = useState<Profile | null>(sample.profile);
  const [events, setEvents] = useState<GhEvent[] | null>(sample.events);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [asOf, setAsOf] = useState(SAMPLE_END);
  const [activeDay, setActiveDay] = useState<Day | null>(null);
  const gridScrollRef = useRef<HTMLDivElement | null>(null);

  // On narrow screens start the 53-week grid at the most recent weeks.
  useEffect(() => {
    const el = gridScrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [data]);

  useEffect(() => {
    if (username == null) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    setProfile(null);
    setEvents(null);

    const u = encodeURIComponent(username);
    Promise.all([
      fetch(`https://github-contributions-api.deno.dev/${u}.json`).then(
        async (r) => {
          if (!r.ok) throw new Error(`No contributions for "${username}"`);
          return (await r.json()) as Contributions;
        },
      ),
      fetch(`https://api.github.com/users/${u}`).then(async (r) => {
        if (!r.ok) throw new Error(`User "${username}" not found`);
        return (await r.json()) as Profile;
      }),
      fetch(`https://api.github.com/users/${u}/events/public?per_page=30`)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []) as Promise<GhEvent[]>,
    ])
      .then(([c, p, e]) => {
        if (cancelled) return;
        setAsOf(Date.now());
        setData(c);
        setProfile(p);
        setEvents(e);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = input.trim();
    if (next && next !== username) setUsername(next);
  }

  const stats = useMemo(() => (data ? deriveStats(data, asOf) : null), [data, asOf]);
  const months = useMemo(() => (data ? deriveMonths(data) : []), [data]);
  const recentCommits = useMemo(
    () => (events ? deriveRecentCommits(events) : []),
    [events],
  );

  return (
    <div className="min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          GitHub · last 12 months{username == null ? " · sample data" : ""}
        </div>

        <form onSubmit={onSubmit} className="mt-3 flex items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <span className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground">
              @
            </span>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="GitHub username"
              placeholder="github username"
              className="pl-7"
              spellCheck={false}
              autoComplete="off"
            />
          </div>
          <Button type="submit" variant="outline" disabled={loading} className="shrink-0">
            {loading ? "Loading…" : "Load live"}
          </Button>
        </form>

        <div className="mt-6 flex items-start gap-4">
          <Avatar className="size-12 shrink-0 sm:size-14">
            {profile?.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={profile.login} />
            )}
            <AvatarFallback>
              {(username ?? DEFAULT_USERNAME).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            {profile ? (
              <>
                <h1 className="break-words font-heading text-2xl">
                  {profile.name ?? profile.login}
                </h1>
                <a
                  href={profile.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground text-sm hover:text-foreground"
                >
                  @{profile.login}
                </a>
                {profile.bio && (
                  <p className="mt-2 text-foreground/80 text-sm">
                    {profile.bio}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                  <span>
                    <span className="text-foreground">
                      {profile.public_repos}
                    </span>{" "}
                    repos
                  </span>
                  <span>
                    <span className="text-foreground">{profile.followers}</span>{" "}
                    followers
                  </span>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            )}
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-destructive text-sm">
            {error}
          </div>
        ) : null}

        <div className="mt-6">
          {data ? (
            <h2 className="font-heading text-xl">
              {data.totalContributions.toLocaleString()} contributions
              {stats && (
                <span className="block font-sans text-muted-foreground text-sm sm:ml-2 sm:inline">
                  · active {stats.activeDays} days · longest{" "}
                  <span className="text-foreground">
                    {stats.longestStreak} days
                  </span>{" "}
                  · current{" "}
                  <span className="text-foreground">
                    {stats.currentStreak} days
                  </span>
                </span>
              )}
            </h2>
          ) : (
            <Skeleton className="h-7 w-72" />
          )}
        </div>

        <div className="mt-4 rounded-xl border border-border/60 bg-background/40 p-4 sm:p-5">
          <div
            ref={gridScrollRef}
            tabIndex={0}
            aria-label="Contribution calendar"
            className="overflow-x-auto overscroll-x-contain pb-1"
          >
          <div className="grid w-max grid-cols-[28px_auto] gap-2">
            <div className="flex flex-col gap-[3px] pt-5">
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <span
                  key={d}
                  className="flex h-3 items-center font-mono text-[10px] text-muted-foreground"
                >
                  {d % 2 === 0 && d <= 4 ? WEEKDAY_LABELS[d / 2] : ""}
                </span>
              ))}
            </div>

            <div>
              <div className="relative h-4">
                {data &&
                  months.map((m) => (
                    <span
                      key={`${m.label}-${m.weekIndex}`}
                      className="absolute font-mono text-[10px] text-muted-foreground"
                      style={{
                        left: `${(m.weekIndex / data.contributions.length) * 100}%`,
                      }}
                    >
                      {m.label}
                    </span>
                  ))}
              </div>

              {/* Hover (mouse) or tap (touch) a day to read it in the footer. */}
              <div
                className="mt-1 flex gap-[3px]"
                onPointerOver={(ev) => {
                  const d = (ev.target as HTMLElement).dataset.date;
                  if (d && data) setActiveDay(findDay(data, d));
                }}
                onClick={(ev) => {
                  const d = (ev.target as HTMLElement).dataset.date;
                  if (d && data) setActiveDay(findDay(data, d));
                }}
              >
                {data
                  ? data.contributions.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-[3px]">
                        {week.map((c) => (
                          <Cell key={c.date} day={c} />
                        ))}
                      </div>
                    ))
                  : Array.from({ length: 53 }).map((_, wi) => (
                      <div key={wi} className="flex flex-col gap-[3px]">
                        {Array.from({ length: 7 }).map((__, di) => (
                          <span
                            key={di}
                            className="size-3 rounded-sm bg-foreground/[0.06] motion-safe:animate-pulse"
                          />
                        ))}
                      </div>
                    ))}
              </div>
            </div>
          </div>

          </div>

          <div className="mt-4 flex flex-col gap-3 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] sm:flex-row sm:items-center sm:justify-between sm:tracking-[0.25em]">
            <span aria-live="polite" className="min-h-4">
              {activeDay ? (
                <span className="text-foreground">
                  {activeDay.contributionCount} on {formatLong(activeDay.date)}
                </span>
              ) : (
                <>
                  <span className="pointer-coarse:hidden">Hover</span>
                  <span className="hidden pointer-coarse:inline">Tap</span> a day to see the date
                </>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span>Less</span>
              <div className="flex gap-[3px]">
                {(
                  [
                    "NONE",
                    "FIRST_QUARTILE",
                    "SECOND_QUARTILE",
                    "THIRD_QUARTILE",
                    "FOURTH_QUARTILE",
                  ] as const
                ).map((lvl) => (
                  <span
                    key={lvl}
                    className="size-3 rounded-sm"
                    style={{ backgroundColor: levelColor(lvl) }}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </div>

        {stats && data && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 [&>*:last-child]:max-sm:col-span-2">
            <Stat
              label="Most active day"
              value={stats.mostActive ? formatShort(stats.mostActive.date) : "—"}
              sub={
                stats.mostActive
                  ? `${stats.mostActive.contributionCount} contributions`
                  : ""
              }
            />
            <Stat
              label="Avg / day"
              value={stats.avgPerDay.toFixed(1)}
              sub="across the year"
            />
            <Stat
              label="Longest break"
              value={`${stats.longestBreak.length} days`}
              sub={
                stats.longestBreak.length > 0
                  ? `${formatShort(stats.longestBreak.start)} – ${formatShort(stats.longestBreak.end)}`
                  : ""
              }
            />
          </div>
        )}

        <div className="mt-8">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
            Recent commits
          </div>
          <div className="mt-3 divide-y divide-border/60 rounded-xl border border-border/60 bg-background/40">
            {events == null
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-4 py-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="mt-2 h-3 w-32" />
                  </div>
                ))
              : recentCommits.length === 0
                ? (
                    <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                      No recent public commits.
                    </div>
                  )
                : recentCommits.slice(0, 8).map((c) => (
                    <a
                      key={c.sha}
                      href={`https://github.com/${c.repo}/commit/${c.sha}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block px-4 py-3 transition-colors hover:bg-foreground/[0.02]"
                    >
                      <div className="truncate text-sm">{c.message}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                        <span className="text-foreground">{c.repo}</span>
                        <span>·</span>
                        <span>{c.sha.slice(0, 7)}</span>
                        <span>·</span>
                        <span>{relativeTime(c.created_at, asOf)}</span>
                      </div>
                    </a>
                  ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function findDay(data: Contributions, date: string) {
  for (const w of data.contributions) for (const d of w) if (d.date === date) return d;
  return null;
}

function Cell({ day }: { day: Day }) {
  const title = `${day.contributionCount} on ${formatLong(day.date)}`;
  return (
    <span
      data-date={day.date}
      title={title}
      className="size-3 rounded-sm"
      style={{ backgroundColor: levelColor(day.contributionLevel) }}
    />
  );
}

function levelColor(level: Day["contributionLevel"]) {
  // teal scale, matches the rest of the showcase palette
  switch (level) {
    case "NONE":
      return "rgba(127, 127, 127, 0.08)";
    case "FIRST_QUARTILE":
      return "rgba(20, 184, 166, 0.28)";
    case "SECOND_QUARTILE":
      return "rgba(20, 184, 166, 0.5)";
    case "THIRD_QUARTILE":
      return "rgba(20, 184, 166, 0.75)";
    case "FOURTH_QUARTILE":
      return "rgba(20, 184, 166, 0.96)";
  }
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-4">
      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
        {label}
      </div>
      <div className="mt-1 font-heading text-2xl tracking-tight">{value}</div>
      <div className="mt-0.5 text-muted-foreground text-xs">{sub}</div>
    </div>
  );
}

function deriveStats(data: Contributions, asOf: number) {
  const flat = data.contributions.flat();
  const sorted = [...flat].sort((a, b) => a.date.localeCompare(b.date));
  const activeDays = flat.filter((d) => d.contributionCount > 0).length;
  const total = data.totalContributions;
  const avgPerDay = sorted.length ? total / sorted.length : 0;

  let mostActive: Day | null = null;
  for (const d of flat) {
    if (!mostActive || d.contributionCount > mostActive.contributionCount) {
      mostActive = d;
    }
  }

  // Streaks (counted on calendar days, ignoring future days)
  const today = new Date(asOf).toISOString().slice(0, 10);
  const past = sorted.filter((d) => d.date <= today);

  let longestStreak = 0;
  let runStreak = 0;
  for (const d of past) {
    if (d.contributionCount > 0) {
      runStreak += 1;
      if (runStreak > longestStreak) longestStreak = runStreak;
    } else {
      runStreak = 0;
    }
  }

  let currentStreak = 0;
  for (let i = past.length - 1; i >= 0; i--) {
    const d = past[i];
    if (d.contributionCount > 0) currentStreak += 1;
    else if (i === past.length - 1) {
      // allow today to be empty without breaking the streak
      continue;
    } else break;
  }

  // Longest break (consecutive zero-days)
  let longestBreak = { length: 0, start: "", end: "" };
  let runStart = "";
  let runLen = 0;
  for (const d of past) {
    if (d.contributionCount === 0) {
      if (runLen === 0) runStart = d.date;
      runLen += 1;
      if (runLen > longestBreak.length) {
        longestBreak = { length: runLen, start: runStart, end: d.date };
      }
    } else {
      runLen = 0;
    }
  }

  return {
    activeDays,
    avgPerDay,
    longestStreak,
    currentStreak,
    longestBreak,
    mostActive,
  };
}

function deriveMonths(data: Contributions) {
  const out: { label: string; weekIndex: number }[] = [];
  let lastMonth = -1;
  data.contributions.forEach((week, wi) => {
    if (week.length === 0) return;
    const firstDate = new Date(week[0].date);
    const month = firstDate.getUTCMonth();
    if (month !== lastMonth) {
      out.push({ label: MONTHS_SHORT[month], weekIndex: wi });
      lastMonth = month;
    }
  });
  return out;
}

type FlatCommit = {
  sha: string;
  message: string;
  repo: string;
  created_at: string;
};

function deriveRecentCommits(events: GhEvent[]): FlatCommit[] {
  const out: FlatCommit[] = [];
  for (const e of events) {
    if (e.type !== "PushEvent" || !e.payload.commits) continue;
    for (const c of e.payload.commits) {
      out.push({
        sha: c.sha,
        message: c.message.split("\n")[0],
        repo: e.repo.name,
        created_at: e.created_at,
      });
    }
  }
  return out;
}

function formatLong(iso: string) {
  // Fixed locale + UTC so server and client render identical strings.
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
}

function relativeTime(iso: string, now: number) {
  const then = new Date(iso).getTime();
  const s = Math.max(1, Math.floor((now - then) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}
