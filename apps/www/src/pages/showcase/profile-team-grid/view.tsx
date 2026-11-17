// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import { GlobeIcon, MailIcon, MapPinIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import type { Teammate } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("teamDirectory.<key>"). */
export const TEAM_DIRECTORY_MESSAGES = {
  eyebrow: "{company} · {people} teammates · {cities} cities",
  title: "Meet the team",
  search: "Search teammates",
  searchPlaceholder: "Search by name or role",
  invite: "Invite",
  noMatch: "No teammates match “{query}”.",
  online: "online",
  away: "away",
  off: "offline",
  email: "Email",
  emailName: "Email {name}",
  profile: "Profile",
  profileName: "{name}’s profile",
  empty: "No teammates yet.",
  errorTitle: "Couldn’t load the team",
  retry: "Try again",
};

export interface TeamDirectoryProps {
  /** Everyone, in display order. Leave it out while they load. */
  people?: Teammate[];
  /** Your company's name, for the header. */
  company: string;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Open your invite flow. Hidden without it. */
  onInvite?: () => void;
  className?: string;
}

const DOT: Record<Teammate["presence"], string> = { online: "bg-category-2", away: "bg-category-3", off: "bg-muted-foreground" };

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function TeamDirectoryScreen({ people, company, status = "ready", error, onRetry, onInvite, className }: TeamDirectoryProps) {
  const t = useMessages("teamDirectory", TEAM_DIRECTORY_MESSAGES);
  const [query, setQuery] = useState("");
  const list = people ?? [];
  const q = query.trim().toLowerCase();
  const departments = [...new Set(list.map((p) => p.department))].map((name) => {
    const all = list.filter((p) => p.department === name);
    return { name, total: all.length, members: all.filter((m) => !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)) };
  });
  const shown = departments.filter((d) => d.members.length);
  const cities = new Set(list.map((p) => p.city).filter(Boolean)).size;
  const linkClass = "-mx-1 inline-flex min-h-8 items-center gap-1 rounded px-1 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10";

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{interpolate(t.eyebrow, { company, people: list.length, cities })}</div>
            <h1 className="mt-1 font-heading text-3xl tracking-tight">{t.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-1.5 text-xs focus-within:ring-2 focus-within:ring-ring sm:w-64 sm:flex-none">
              <SearchIcon aria-hidden className="size-3.5 shrink-0 opacity-60" />
              <input
                aria-label={t.search}
                className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-xs"
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                type="search"
                value={query}
              />
            </div>
            {onInvite ? (
              <Button className="shrink-0" onClick={onInvite} type="button">
                {t.invite}
              </Button>
            ) : null}
          </div>
        </div>

        {status === "error" ? (
          <div className="mt-8 rounded-xl border border-border/60 py-12 text-center">
            <p className="font-medium">{t.errorTitle}</p>
            {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
            {onRetry ? (
              <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                {t.retry}
              </Button>
            ) : null}
          </div>
        ) : !people || status === "loading" ? (
          <div aria-busy="true" className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {["a", "b", "c"].map((k) => (
              <Skeleton className="h-40 w-full rounded-xl motion-reduce:animate-none" key={k} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="mt-10 text-center text-muted-foreground text-sm">{t.empty}</p>
        ) : shown.length === 0 ? (
          <p aria-live="polite" className="mt-10 text-center text-muted-foreground text-sm">
            {interpolate(t.noMatch, { query })}
          </p>
        ) : (
          shown.map((d) => (
            <section aria-label={d.name} className="mt-8 sm:mt-10" key={d.name}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="font-heading text-base">{d.name}</h2>
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{d.total}</span>
                <span aria-hidden className="ms-auto h-px flex-1 bg-border/40" />
              </div>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {d.members.map((m) => (
                  <li className="rounded-xl border border-border/60 bg-background/40 p-4 transition-colors hover:bg-background/60" key={m.id}>
                    <div className="flex items-start gap-3">
                      <div aria-hidden className="relative shrink-0">
                        <Avatar className="size-12">
                          {m.avatarUrl ? <AvatarImage alt="" src={m.avatarUrl} /> : null}
                          <AvatarFallback>{initials(m.name)}</AvatarFallback>
                        </Avatar>
                        <span className={cn("absolute end-0 bottom-0 size-3 rounded-full border-2 border-background", DOT[m.presence])} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-1.5">
                          <h3 className="font-normal text-sm">{m.name}</h3>
                          <span className="sr-only">, {t[m.presence]}</span>
                          {m.pronouns ? <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{m.pronouns}</span> : null}
                        </div>
                        <div className="text-muted-foreground text-xs">{m.role}</div>
                      </div>
                    </div>
                    {m.bio ? <p className="mt-3 text-foreground/85 text-sm leading-snug">{m.bio}</p> : null}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
                      {m.city ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPinIcon aria-hidden className="size-3" />
                          {m.city}
                        </span>
                      ) : null}
                      {m.email ? (
                        <a className={linkClass} href={`mailto:${m.email}`}>
                          <MailIcon aria-hidden className="size-3" />
                          <span className="sr-only">{interpolate(t.emailName, { name: m.name })}</span>
                          <span aria-hidden>{t.email}</span>
                        </a>
                      ) : null}
                      {m.profileHref ? (
                        <WirefrontLink className={linkClass} href={m.profileHref}>
                          <GlobeIcon aria-hidden className="size-3" />
                          <span className="sr-only">{interpolate(t.profileName, { name: m.name })}</span>
                          <span aria-hidden>{t.profile}</span>
                        </WirefrontLink>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

export function TeamDirectory(props: TeamDirectoryProps) {
  return (
    <ScreenBoundary name="TeamDirectory">
      <TeamDirectoryScreen {...props} />
    </ScreenBoundary>
  );
}
