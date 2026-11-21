// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { CheckIcon, GitBranchIcon, MapPinIcon, MessageCircleIcon, PlusIcon, UserPlusIcon, XIcon } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import type { Suggestion } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("suggestedIntros.<key>"). */
export const SUGGESTED_INTROS_MESSAGES = {
  eyebrow: "People you may know",
  title: "Suggested intros",
  subtitle: "Based on your team, the topics you read, and people followed by folks you trust.",
  dismiss: "Dismiss {name}",
  followers: "{count} followers",
  mutual: "{count} mutual",
  follow: "Follow",
  following: "Following",
  seeAll: "See all suggestions →",
  empty: "No suggestions right now.",
  errorTitle: "Couldn’t load suggestions",
  retry: "Try again",
};

export interface SuggestedIntrosProps {
  /** Suggested people. Leave it out while they load. */
  suggestions?: Suggestion[];
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Follow or unfollow. It flips at once and back if this fails. Hidden without it. */
  onFollow?: Action<{ id: string; following: boolean }>;
  /** Stop suggesting someone; the card goes at once and comes back if this fails. Hidden without it. */
  onDismiss?: Action<string>;
  /** Where "See all" goes. Hidden when not given. */
  allHref?: string;
  className?: string;
}

const TONE: Record<Suggestion["reason"], string> = {
  shared: "bg-category-8/12 text-category-8-foreground",
  team: "bg-category-2/12 text-category-2-foreground",
  topic: "bg-category-3/12 text-category-3-foreground",
  repo: "bg-category-5/12 text-category-5-foreground",
};
const GLYPH: Record<Suggestion["reason"], ReactNode> = {
  shared: <UserPlusIcon aria-hidden className="size-3" />,
  team: <PlusIcon aria-hidden className="size-3" />,
  topic: <MessageCircleIcon aria-hidden className="size-3" />,
  repo: <GitBranchIcon aria-hidden className="size-3" />,
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function SuggestedIntrosScreen({ suggestions, status = "ready", error, onRetry, onFollow, onDismiss, allHref, className }: SuggestedIntrosProps) {
  const t = useMessages("suggestedIntros", SUGGESTED_INTROS_MESSAGES);
  const fmt = useFormat();
  const [list, setList] = useState(suggestions ?? []);
  useEffect(() => setList(suggestions ?? []), [suggestions]);
  const follow = useAction(onFollow ?? (async () => {}), {
    optimistic: ({ id, following }) => {
      const flip = (on: boolean) => setList((all) => all.map((s) => (s.id === id ? { ...s, following: on } : s)));
      flip(following);
      return () => flip(!following);
    },
  });
  const dismiss = useAction(onDismiss ?? (async () => {}), {
    optimistic: (id) => {
      const before = list;
      setList((all) => all.filter((s) => s.id !== id));
      return () => setList(before);
    },
  });
  const compact = (n: number) => fmt.number(n, { notation: n >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 });

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-3xl">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
        <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
        <p className="mt-1 text-muted-foreground text-sm">{t.subtitle}</p>
        {follow.error || dismiss.error ? (
          <p className="mt-3 text-destructive-foreground text-sm" role="alert">
            {follow.error ?? dismiss.error}
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
        ) : !suggestions || status === "loading" ? (
          <div aria-busy="true" className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {["a", "b", "c", "d"].map((k) => (
              <Skeleton className="h-56 w-full rounded-xl motion-reduce:animate-none" key={k} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="mt-6 rounded-xl border border-border/60 py-12 text-center text-muted-foreground text-sm">{t.empty}</p>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {list.map((s) => (
              <li className="rounded-xl border border-border/60 bg-background/40 p-4 sm:p-5" key={s.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar aria-hidden className="size-12 shrink-0">
                      {s.avatarUrl ? <AvatarImage alt="" src={s.avatarUrl} /> : null}
                      <AvatarFallback className="text-base">{initials(s.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h2 className="font-normal text-sm">{s.name}</h2>
                      <div className="text-muted-foreground text-xs">{s.role}</div>
                    </div>
                  </div>
                  {onDismiss ? (
                    <button
                      aria-label={interpolate(t.dismiss, { name: s.name })}
                      className="-me-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground outline-none hover:bg-foreground/[0.05] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-10"
                      onClick={() => void dismiss.run(s.id, s.id)}
                      type="button"
                    >
                      <XIcon aria-hidden className="size-3.5" />
                    </button>
                  ) : null}
                </div>
                <div className={cn("mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em]", TONE[s.reason])}>
                  {GLYPH[s.reason]}
                  {s.context}
                </div>
                {s.bio ? <p className="mt-3 text-foreground/85 text-sm leading-snug">{s.bio}</p> : null}
                <div className="mt-3 flex items-center gap-3 text-muted-foreground text-xs">
                  {s.city ? (
                    <>
                      <span className="inline-flex items-center gap-1">
                        <MapPinIcon aria-hidden className="size-3" />
                        {s.city}
                      </span>
                      <span aria-hidden>·</span>
                    </>
                  ) : null}
                  <span className="font-mono">{interpolate(t.followers, { count: compact(s.followers) })}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-border/60 border-t pt-3">
                  <div className="flex items-center -space-x-1.5">
                    {s.mutuals.slice(0, 3).map((m) => (
                      <Avatar aria-hidden className="size-5 border-2 border-background" key={m}>
                        <AvatarFallback className="text-[10px]">{initials(m)}</AvatarFallback>
                      </Avatar>
                    ))}
                    <span className="ms-3 font-mono text-[10px] text-muted-foreground">{interpolate(t.mutual, { count: s.mutuals.length })}</span>
                  </div>
                  {onFollow ? (
                    <Button aria-pressed={s.following} disabled={follow.isPending(s.id)} onClick={() => void follow.run({ id: s.id, following: !s.following }, s.id)} size="sm" type="button" variant={s.following ? "outline" : "default"}>
                      {s.following ? <CheckIcon aria-hidden /> : <UserPlusIcon aria-hidden />}
                      {s.following ? t.following : t.follow}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        {allHref && suggestions ? (
          <div className="mt-6 text-center">
            <WirefrontLink className="rounded font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" href={allHref}>
              {t.seeAll}
            </WirefrontLink>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function SuggestedIntros(props: SuggestedIntrosProps) {
  return (
    <ScreenBoundary name="SuggestedIntros">
      <SuggestedIntrosScreen {...props} />
    </ScreenBoundary>
  );
}
