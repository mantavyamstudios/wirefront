// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@wirefront/ui/dropdown-menu";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import { MessageCircleIcon, MoreHorizontalIcon, PhoneIcon, SearchIcon, VideoIcon } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import type { Contact } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("contactDirectory.<key>"). */
export const CONTACT_DIRECTORY_MESSAGES = {
  eyebrow: "{company} directory · {count} people",
  title: "Contact directory",
  find: "Find people",
  findPlaceholder: "Find by name, role, or team",
  shortcut: "⌘K",
  noMatch: "Nobody matches “{query}”.",
  online: "online",
  away: "away",
  off: "offline",
  message: "Message",
  video: "Video call",
  call: "Call",
  actionFor: "{action} {name}",
  actionsFor: "Actions for {name}",
  jump: "Jump to letter",
  empty: "No one in the directory yet.",
  errorTitle: "Couldn’t load the directory",
  retry: "Try again",
};

export interface ContactDirectoryProps {
  /** Everyone in the directory. Leave it out while it loads. */
  people?: Contact[];
  /** Your company's name, for the header. */
  company: string;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Contact actions, by person id. Each is hidden without its handler. */
  onMessage?: (id: string) => void;
  onVideoCall?: (id: string) => void;
  onCall?: (id: string) => void;
  className?: string;
}

const DOT: Record<Contact["presence"], string> = { online: "bg-success", away: "bg-category-3", off: "bg-muted-foreground/40" };
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Rows: name + role/email always get the width. Actions show on hover/focus for
// mouse users and collapse to a ⋯ menu on touch. The A–Z rail supports
// press-and-drag scrubbing on touch screens.
function ContactDirectoryScreen({ people, company, status = "ready", error, onRetry, onMessage, onVideoCall, onCall, className }: ContactDirectoryProps) {
  const t = useMessages("contactDirectory", CONTACT_DIRECTORY_MESSAGES);
  const { locale } = useWirefront();
  const uid = useId();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const list = people ?? [];
  const q = query.trim().toLowerCase();
  const shown = list.filter((p) => !q || p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
  const groups = new Map<string, Contact[]>();
  for (const p of [...shown].sort((a, b) => (a.name.split(" ").pop() ?? a.name).localeCompare(b.name.split(" ").pop() ?? b.name, locale))) {
    const key = ((p.name.split(" ").pop() ?? p.name)[0] ?? "#").toLocaleUpperCase(locale);
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  const letters = [...new Set([...ALPHABET, ...groups.keys()])];
  const anchor = (letter: string) => `${uid}-letter-${letter}`;
  const jumpTo = (letter: string) => document.getElementById(anchor(letter))?.scrollIntoView({ block: "start", behavior: "auto" });
  const actions: { key: string; label: string; icon: ReactNode; run: (id: string) => void }[] = [
    ...(onMessage ? [{ key: "message", label: t.message, icon: <MessageCircleIcon aria-hidden className="size-3.5" />, run: onMessage }] : []),
    ...(onVideoCall ? [{ key: "video", label: t.video, icon: <VideoIcon aria-hidden className="size-3.5" />, run: onVideoCall }] : []),
    ...(onCall ? [{ key: "call", label: t.call, icon: <PhoneIcon aria-hidden className="size-3.5" />, run: onCall }] : []),
  ];

  // ⌘K / Ctrl+K focuses search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  // Touch scrubbing on the letter rail.
  const groupsRef = useRef(groups);
  groupsRef.current = groups;
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const scrub = (e: PointerEvent) => {
      const letter = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-letter]")?.dataset.letter;
      if (letter && groupsRef.current.has(letter)) document.getElementById(`${uid}-letter-${letter}`)?.scrollIntoView({ block: "start", behavior: "auto" });
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      rail.setPointerCapture(e.pointerId);
      scrub(e);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && rail.hasPointerCapture(e.pointerId)) scrub(e);
    };
    rail.addEventListener("pointerdown", down);
    rail.addEventListener("pointermove", move);
    return () => {
      rail.removeEventListener("pointerdown", down);
      rail.removeEventListener("pointermove", move);
    };
  }, [uid]);

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{interpolate(t.eyebrow, { company, count: list.length })}</div>
            <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
          </div>
          <div className="flex min-h-9 items-center gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-1.5 text-xs focus-within:ring-2 focus-within:ring-ring sm:w-80">
            <SearchIcon aria-hidden className="size-3.5 shrink-0 opacity-60" />
            <input
              aria-label={t.find}
              className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-xs"
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.findPlaceholder}
              ref={searchRef}
              type="search"
              value={query}
            />
            <kbd className="font-mono text-[10px] text-muted-foreground max-sm:hidden pointer-coarse:hidden">{t.shortcut}</kbd>
          </div>
        </div>

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
        ) : !people || status === "loading" ? (
          <div aria-busy="true" className="mt-6 flex flex-col gap-2">
            {["a", "b", "c", "d"].map((k) => (
              <Skeleton className="h-14 w-full motion-reduce:animate-none" key={k} />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-[minmax(0,1fr)_24px] gap-2 sm:grid-cols-[minmax(0,1fr)_28px] sm:gap-4">
            {/* overflow-clip (not hidden) keeps the sticky letter headers working. */}
            <div className="overflow-clip rounded-xl border border-border/60 bg-background/40">
              {list.length === 0 ? <p className="px-5 py-10 text-center text-muted-foreground text-sm">{t.empty}</p> : null}
              {list.length && shown.length === 0 ? (
                <p aria-live="polite" className="px-5 py-10 text-center text-muted-foreground text-sm">
                  {interpolate(t.noMatch, { query })}
                </p>
              ) : null}
              {[...groups.entries()].map(([letter, members]) => (
                <section aria-labelledby={anchor(letter)} key={letter}>
                  <h2
                    className="sticky top-0 z-10 flex scroll-mt-2 items-center gap-3 border-border/40 border-b bg-background px-4 py-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] sm:px-5"
                    id={anchor(letter)}
                  >
                    {letter}
                    <span aria-hidden className="h-px flex-1 bg-border/40" />
                    <span>{members.length}</span>
                  </h2>
                  <ul className="divide-y divide-border/40">
                    {members.map((p) => (
                      <li className="group grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-foreground/[0.02] sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:px-5" key={p.id}>
                        <div aria-hidden className="relative">
                          <Avatar className="size-9">
                            {p.avatarUrl ? <AvatarImage alt="" src={p.avatarUrl} /> : null}
                            <AvatarFallback className="text-xs">{initials(p.name)}</AvatarFallback>
                          </Avatar>
                          <span className={cn("absolute end-0 bottom-0 size-2.5 rounded-full border-2 border-background", DOT[p.presence])} />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm">
                            {p.name}
                            <span className="sr-only">, {t[p.presence]}</span>
                          </div>
                          <div className="truncate text-muted-foreground text-xs">
                            {p.role}
                            <span className="max-sm:hidden"> · {p.email}</span>
                          </div>
                        </div>
                        {actions.length ? (
                          <>
                            {/* Fine pointers: inline actions revealed on row hover or keyboard focus. */}
                            <div className="flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-sm:hidden pointer-coarse:hidden">
                              {actions.map((a) => (
                                <button
                                  aria-label={interpolate(t.actionFor, { action: a.label, name: p.name })}
                                  className="grid size-7 place-items-center rounded-md text-muted-foreground outline-none hover:bg-foreground/[0.05] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                                  key={a.key}
                                  onClick={() => a.run(p.id)}
                                  type="button"
                                >
                                  {a.icon}
                                </button>
                              ))}
                            </div>
                            {/* Touch / phones: one ⋯ menu. */}
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                aria-label={interpolate(t.actionsFor, { name: p.name })}
                                className="hidden size-10 place-items-center rounded-md text-muted-foreground outline-none hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-ring max-sm:grid pointer-coarse:grid"
                              >
                                <MoreHorizontalIcon aria-hidden className="size-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {actions.map((a) => (
                                  <DropdownMenuItem key={a.key} onClick={() => a.run(p.id)}>
                                    {a.icon}
                                    {a.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            <nav aria-label={t.jump} className="sticky top-2 flex touch-none select-none flex-col items-center self-start pt-1 font-mono text-[10px]" ref={railRef}>
              {letters.map((l) => {
                const active = groups.has(l);
                return (
                  <a
                    aria-disabled={!active || undefined}
                    className={cn("grid size-6 place-items-center rounded outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring", active ? "text-foreground hover:bg-foreground/[0.06]" : "text-muted-foreground")}
                    data-letter={l}
                    href={`#${anchor(l)}`}
                    key={l}
                    onClick={(e) => {
                      e.preventDefault();
                      if (active) jumpTo(l);
                    }}
                    tabIndex={active ? undefined : -1}
                  >
                    {l}
                  </a>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

export function ContactDirectory(props: ContactDirectoryProps) {
  return (
    <ScreenBoundary name="ContactDirectory">
      <ContactDirectoryScreen {...props} />
    </ScreenBoundary>
  );
}
