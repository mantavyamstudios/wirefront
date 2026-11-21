// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@wirefront/ui/popover";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { CalendarDaysIcon, CheckIcon, MapPinIcon, PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { PersonSummary } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("personHoverCard.<key>"). */
export const PERSON_HOVER_CARD_MESSAGES = {
  handle: "@{handle}",
  verified: "Verified",
  follow: "Follow",
  followingButton: "Following",
  joined: "Joined {date}",
  following: "following",
  followers: "followers",
  mutuals: "Followed by {names}",
  mutualsMore: "Followed by {names} and {count} others you follow",
  profile: "{name} profile",
  mention: "@{name}",
};

export interface PersonHoverCardProps {
  /** The person the mention points at. */
  person: PersonSummary;
  /** Follow (true) or unfollow (false). It flips at once and back if this fails. Hidden without it. */
  onToggleFollow?: Action<boolean>;
  /** Show the card on its own instead of behind a mention. */
  inline?: boolean;
  className?: string;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Card({ person, onToggleFollow, className }: PersonHoverCardProps) {
  const t = useMessages("personHoverCard", PERSON_HOVER_CARD_MESSAGES);
  const fmt = useFormat();
  const { locale } = useWirefront();
  const [following, setFollowing] = useState(person.isFollowing);
  useEffect(() => setFollowing(person.isFollowing), [person.isFollowing]);
  const follow = useAction(onToggleFollow ?? (async () => {}), {
    optimistic: (next) => {
      setFollowing(next);
      return () => setFollowing(!next);
    },
  });
  const compact = (n: number) => fmt.number(n, { notation: n >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 });
  const firstNames = (names: string[]) => new Intl.ListFormat(locale, { type: "conjunction", style: "long" }).format(names.map((n) => n.split(" ")[0] ?? n));

  return (
    <div className={cn("relative w-[min(20rem,calc(100vw-2rem))] overflow-hidden bg-background", className)}>
      <div aria-hidden className="h-16 bg-gradient-to-br from-category-8/30 via-foreground/[0.04] to-category-6/30" />
      <div className="relative px-4 pb-4">
        <Avatar aria-hidden className="-mt-7 size-14 border-4 border-background bg-foreground">
          {person.avatarUrl ? <AvatarImage alt="" src={person.avatarUrl} /> : null}
          <AvatarFallback className="bg-foreground text-background">{initials(person.name)}</AvatarFallback>
        </Avatar>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-base">{person.name}</span>
              {person.verified ? (
                <span className="grid size-4 shrink-0 place-items-center rounded-full bg-category-1 text-white">
                  <span className="sr-only">{t.verified}</span>
                  <CheckIcon aria-hidden className="size-2.5" />
                </span>
              ) : null}
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {interpolate(t.handle, { handle: person.handle })}
              {person.pronouns ? ` · ${person.pronouns}` : ""}
            </div>
          </div>
          {onToggleFollow ? (
            <Button aria-pressed={following} disabled={follow.isPending()} onClick={() => void follow.run(!following)} size="sm" type="button" variant={following ? "outline" : "default"}>
              {following ? <CheckIcon aria-hidden /> : <PlusIcon aria-hidden />}
              {following ? t.followingButton : t.follow}
            </Button>
          ) : null}
        </div>
        {follow.error ? (
          <p className="mt-2 text-destructive-foreground text-xs" role="alert">
            {follow.error}
          </p>
        ) : null}
        {person.bio ? <p className="mt-3 text-foreground/85 text-sm leading-snug">{person.bio}</p> : null}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-muted-foreground text-xs">
          {person.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPinIcon aria-hidden className="size-3" />
              {person.location}
            </span>
          ) : null}
          {person.joinedAt ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDaysIcon aria-hidden className="size-3" />
              {interpolate(t.joined, { date: fmt.date(`${person.joinedAt}T00:00:00Z`, { month: "short", year: "numeric", timeZone: "UTC" }) })}
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex items-center gap-4 border-border/60 border-t pt-3 text-xs">
          <span>
            <span className="font-mono">{compact(person.following)}</span> <span className="text-muted-foreground">{t.following}</span>
          </span>
          <span>
            <span className="font-mono">{compact(person.followers)}</span> <span className="text-muted-foreground">{t.followers}</span>
          </span>
        </div>
        {person.mutuals?.names.length ? (
          <div className="mt-3 flex items-start -space-x-1.5">
            {person.mutuals.names.slice(0, 3).map((n) => (
              <Avatar aria-hidden className="size-5 border-2 border-background" key={n}>
                <AvatarFallback className="text-[10px]">{initials(n)}</AvatarFallback>
              </Avatar>
            ))}
            <span className="ms-3 min-w-0 text-muted-foreground text-xs">
              {person.mutuals.more ? interpolate(t.mutualsMore, { names: person.mutuals.names.slice(0, 3).map((n) => n.split(" ")[0]).join(", "), count: person.mutuals.more }) : interpolate(t.mutuals, { names: firstNames(person.mutuals.names) })}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// A Popover that opens on hover for mice (200ms delay) and on tap for touch,
// so the card isn't pointer-only. Keyboard users open it with Enter/Space.
function PersonHoverCardScreen(props: PersonHoverCardProps) {
  const t = useMessages("personHoverCard", PERSON_HOVER_CARD_MESSAGES);
  const { person } = props;
  if (props.inline) return <Card {...props} />;
  return (
    <Popover>
      <PopoverTrigger
        className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.06] px-2 py-0.5 align-baseline font-medium text-foreground/90 hover:bg-foreground/[0.1] pointer-coarse:py-1"
        delay={200}
        openOnHover
      >
        <Avatar aria-hidden className="size-3.5">
          <AvatarFallback className="text-[8px]">{initials(person.name)}</AvatarFallback>
        </Avatar>
        {interpolate(t.mention, { name: person.name })}
      </PopoverTrigger>
      <PopoverContent aria-label={interpolate(t.profile, { name: person.name })} className="overflow-hidden [&_[data-slot=popover-viewport]]:p-0">
        <Card {...props} />
      </PopoverContent>
    </Popover>
  );
}

export function PersonHoverCard(props: PersonHoverCardProps) {
  return (
    <ScreenBoundary name="PersonHoverCard">
      <PersonHoverCardScreen {...props} />
    </ScreenBoundary>
  );
}
