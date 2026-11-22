// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@wirefront/ui/tabs";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
  WirefrontLink,
} from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import {
  CalendarDaysIcon,
  GitBranchIcon,
  GlobeIcon,
  MailIcon,
  MapPinIcon,
  MessageCircleIcon,
  StarIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import type { PublicProfile } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("profilePage.<key>"). */
export const PROFILE_PAGE_MESSAGES = {
  handle: "@{handle}",
  message: "Message",
  follow: "Follow",
  unfollow: "Following",
  joined: "Joined {date}",
  sections: "Profile sections",
  overview: "Overview",
  projects: "Projects",
  activity: "Activity",
  following: "Following",
  followers: "Followers",
  posts: "Posts",
  stars: "Stars",
  pinned: "Pinned projects",
  recent: "Recent activity",
  starsLabel: "{count} stars",
  forksLabel: "{count} forks",
  noProjects: "No projects yet.",
  noActivity: "No recent activity.",
  errorTitle: "Couldn’t load this profile",
  retry: "Try again",
};

export interface ProfilePageProps {
  /** The profile. Leave it out while it loads. */
  profile?: PublicProfile;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Follow (true) or unfollow (false). It flips at once and back if this fails. Hidden without it. */
  onToggleFollow?: Action<boolean>;
  /** Start a conversation. Hidden without it. */
  onMessage?: () => void;
  className?: string;
}

const TAG_TONES = [
  "bg-category-8/12 text-category-8-foreground",
  "bg-category-6/12 text-category-6-foreground",
  "bg-category-3/12 text-category-3-foreground",
  "bg-category-4/12 text-category-4-foreground",
];
const STAT_KEYS = ["following", "followers", "posts", "stars"] as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Meta({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden>{icon}</span>
      {children}
    </span>
  );
}

function ProfilePageScreen({
  profile,
  status = "ready",
  error,
  onRetry,
  onToggleFollow,
  onMessage,
  className,
}: ProfilePageProps) {
  const t = useMessages("profilePage", PROFILE_PAGE_MESSAGES);
  const fmt = useFormat();
  const [following, setFollowing] = useState(Boolean(profile?.following));
  useEffect(
    () => setFollowing(Boolean(profile?.following)),
    [profile?.following]
  );
  const follow = useAction(onToggleFollow ?? (async () => {}), {
    optimistic: (next) => {
      setFollowing(next);
      return () => setFollowing(!next);
    },
  });
  const compact = (n: number) =>
    fmt.number(n, {
      notation: n >= 10_000 ? "compact" : "standard",
      maximumFractionDigits: 1,
    });

  if (status === "error" || !profile || status === "loading") {
    return (
      <div className={cn("min-h-svh bg-background text-foreground", className)}>
        <div className="h-32 w-full bg-linear-to-br from-category-8/30 via-foreground/4 to-category-6/30 sm:h-48" />
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {status === "error" ? (
            <div className="rounded-xl border border-border/60 py-12 text-center">
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
          ) : (
            <div aria-busy="true" className="flex flex-col gap-4">
              <Skeleton className="h-10 w-64 motion-reduce:animate-none" />
              <Skeleton className="h-48 w-full rounded-xl motion-reduce:animate-none" />
            </div>
          )}
        </div>
      </div>
    );
  }

  const followers =
    profile.stats.followers +
    (following && !profile.following
      ? 1
      : !following && profile.following
        ? -1
        : 0);
  const stats = { ...profile.stats, followers };
  const statList = (
    <>
      {STAT_KEYS.map((k) => (
        <span key={k}>
          <span className="font-mono text-foreground">{compact(stats[k])}</span>{" "}
          {t[k]}
        </span>
      ))}
    </>
  );
  const projects = profile.projects.length ? (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {profile.projects.map((p) => {
        const name = (
          <span className="flex min-w-0 items-center gap-2 break-all font-mono text-sm">
            <GitBranchIcon
              aria-hidden
              className="size-3.5 shrink-0 opacity-60"
            />
            {p.name}
          </span>
        );
        return (
          <article
            className="rounded-xl border border-border/60 bg-background/40 p-4"
            key={p.id}
          >
            <h3>
              {p.href ? (
                <WirefrontLink
                  className="rounded outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  href={p.href}
                >
                  {name}
                </WirefrontLink>
              ) : (
                name
              )}
            </h3>
            <p className="mt-1.5 text-muted-foreground text-xs leading-relaxed">
              {p.blurb}
            </p>
            <div className="mt-3 flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="size-2 rounded-full bg-category-1"
                />
                {p.language}
              </span>
              <span className="inline-flex items-center gap-1">
                <StarIcon aria-hidden className="size-3" />
                <span className="sr-only">
                  {interpolate(t.starsLabel, { count: fmt.number(p.stars) })}
                </span>
                <span aria-hidden>{fmt.number(p.stars)}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <GitBranchIcon aria-hidden className="size-3" />
                <span className="sr-only">
                  {interpolate(t.forksLabel, { count: fmt.number(p.forks) })}
                </span>
                <span aria-hidden>{fmt.number(p.forks)}</span>
              </span>
            </div>
          </article>
        );
      })}
    </div>
  ) : (
    <p className="mt-3 text-muted-foreground text-sm">{t.noProjects}</p>
  );
  const activity = profile.activity.length ? (
    <ul className="mt-3 flex flex-col gap-2.5">
      {profile.activity.map((a) => (
        <li
          className="flex items-baseline gap-2 text-foreground/85 text-sm"
          key={a.id}
        >
          <span
            aria-hidden
            className="size-1.5 shrink-0 -translate-y-0.5 rounded-full bg-foreground/40"
          />
          <span className="shrink-0 text-muted-foreground">{a.verb}</span>
          <span className="min-w-0 truncate">{a.target}</span>
          <time
            className="ms-auto shrink-0 font-mono text-[10px] text-muted-foreground"
            dateTime={a.at}
          >
            {fmt.relative(a.at)}
          </time>
        </li>
      ))}
    </ul>
  ) : (
    <p className="mt-3 text-muted-foreground text-sm">{t.noActivity}</p>
  );

  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      <div className="relative h-32 w-full overflow-hidden bg-linear-to-br from-category-8/30 via-foreground/4 to-category-6/30 sm:h-48">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
      </div>
      <div className="mx-auto max-w-5xl px-4 pb-10 sm:px-6 lg:px-8">
        {/* Phones: avatar + name, then actions on their own full-width row. */}
        <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 items-end gap-3 sm:gap-4">
            <Avatar
              aria-hidden
              className="size-20 shrink-0 border-4 border-background bg-foreground sm:size-24"
            >
              {profile.avatarUrl ? (
                <AvatarImage alt="" src={profile.avatarUrl} />
              ) : null}
              <AvatarFallback className="bg-foreground text-2xl text-background">
                {initials(profile.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 pb-1 sm:pb-2">
              <h1 className="font-heading text-xl tracking-tight sm:text-2xl">
                {profile.name}
              </h1>
              <div className="text-muted-foreground text-sm">
                {interpolate(t.handle, { handle: profile.handle })}
                {profile.headline ? ` · ${profile.headline}` : ""}
              </div>
            </div>
          </div>
          {onMessage || onToggleFollow ? (
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:pb-2">
              {onMessage ? (
                <Button onClick={onMessage} type="button" variant="outline">
                  <MessageCircleIcon aria-hidden />
                  {t.message}
                </Button>
              ) : null}
              {onToggleFollow ? (
                <Button
                  aria-pressed={following}
                  onClick={() => void follow.run(!following)}
                  type="button"
                  variant={following ? "outline" : "default"}
                >
                  {following ? t.unfollow : t.follow}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
        {follow.error ? (
          <p className="mt-2 text-destructive-foreground text-sm" role="alert">
            {follow.error}
          </p>
        ) : null}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          {profile.bio ? (
            <p className="max-w-prose text-foreground/85 text-sm leading-relaxed">
              {profile.bio}
            </p>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-muted-foreground text-xs *:min-w-0 *:break-all">
            {profile.location ? (
              <Meta icon={<MapPinIcon className="size-3.5" />}>
                {profile.location}
              </Meta>
            ) : null}
            {profile.email ? (
              <Meta icon={<MailIcon className="size-3.5" />}>
                {profile.email}
              </Meta>
            ) : null}
            {profile.website ? (
              <Meta icon={<GlobeIcon className="size-3.5" />}>
                {profile.website}
              </Meta>
            ) : null}
            <Meta icon={<CalendarDaysIcon className="size-3.5" />}>
              {interpolate(t.joined, {
                date: fmt.date(`${profile.joinedAt}T00:00:00Z`, {
                  month: "short",
                  year: "numeric",
                  timeZone: "UTC",
                }),
              })}
            </Meta>
          </div>
        </div>
        {profile.tags.length ? (
          <ul className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
            {profile.tags.map((tag, i) => (
              <li
                className={cn(
                  "rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em]",
                  TAG_TONES[i % TAG_TONES.length]
                )}
                key={tag}
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}

        {/* Stats sit above the tabs on phones. */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs md:hidden">
          {statList}
        </div>
        <Tabs className="mt-3 md:mt-5" defaultValue="overview">
          <div className="flex items-center gap-5 border-border/60 border-b">
            <TabsList
              aria-label={t.sections}
              className="h-auto flex-wrap"
              variant="line"
            >
              {(["overview", "projects", "activity"] as const).map((k) => (
                <TabsTrigger
                  className="px-1 py-3 text-muted-foreground data-active:text-foreground"
                  key={k}
                  value={k}
                >
                  {t[k]}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="ms-auto flex shrink-0 items-center gap-4 text-muted-foreground text-xs max-md:hidden">
              {statList}
            </div>
          </div>
          <TabsContent className="mt-6" value="overview">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
              <section aria-labelledby="profile-pinned">
                <h2
                  className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]"
                  id="profile-pinned"
                >
                  {t.pinned}
                </h2>
                {projects}
              </section>
              <section aria-labelledby="profile-recent">
                <h2
                  className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]"
                  id="profile-recent"
                >
                  {t.recent}
                </h2>
                {activity}
              </section>
            </div>
          </TabsContent>
          <TabsContent className="mt-6" value="projects">
            {projects}
          </TabsContent>
          <TabsContent className="mt-6" value="activity">
            {activity}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export function ProfilePage(props: ProfilePageProps) {
  return (
    <ScreenBoundary name="ProfilePage">
      <ProfilePageScreen {...props} />
    </ScreenBoundary>
  );
}
