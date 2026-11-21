// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useMessages } from "@wirefront/ui/wirefront/provider";
import { CornerDownLeftIcon } from "lucide-react";
import { Fragment, useId, useState } from "react";
import type { MentionGroup, Mentionable } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("mentionComposer.<key>"). */
export const MENTION_COMPOSER_MESSAGES = {
  label: "Reply to thread",
  suggestions: "Mention suggestions",
  people: "People",
  groups: "Groups",
  navigate: "navigate",
  insert: "insert",
};

export interface MentionComposerProps {
  members: Mentionable[];
  groups?: MentionGroup[];
  /** Controlled text; pass with onChange. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Called with the handle each time a mention is inserted. */
  onMention?: (handle: string) => void;
  className?: string;
}

type Option = { id: string; kind: "person"; m: Mentionable } | { id: string; kind: "group"; g: MentionGroup };

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// A mention combobox: typing "@…" at the end of the text filters people and groups. ↑/↓/Enter/Esc
// on a keyboard, tap on touch. Phones get the suggestions docked full width under the composer;
// sm+ a 20rem popover.
function MentionComposerScreen({ members, groups = [], value: controlled, defaultValue = "", onChange, onMention, className }: MentionComposerProps) {
  const t = useMessages("mentionComposer", MENTION_COMPOSER_MESSAGES);
  const uid = useId();
  const [local, setLocal] = useState(defaultValue);
  const value = controlled ?? local;
  const setValue = (next: string) => {
    setLocal(next);
    onChange?.(next);
  };
  const [activeIdx, setActiveIdx] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const query = /@(\w*)$/.exec(value)?.[1]?.toLowerCase() ?? null;
  const people = query == null ? [] : members.filter((m) => m.handle.toLowerCase().startsWith(query) || m.name.toLowerCase().includes(query));
  const teams = query == null ? [] : groups.filter((g) => g.handle.toLowerCase().startsWith(query));
  const options: Option[] = [...people.map((m) => ({ id: `${uid}-p-${m.id}`, kind: "person" as const, m })), ...teams.map((g) => ({ id: `${uid}-g-${g.handle}`, kind: "group" as const, g }))];
  const open = query != null && !dismissed && options.length > 0;
  const active = Math.min(activeIdx, Math.max(options.length - 1, 0));
  const insert = (o: Option) => {
    const handle = o.kind === "person" ? o.m.handle : o.g.handle;
    setValue(value.replace(/@\w*$/, `@${handle} `));
    setActiveIdx(0);
    onMention?.(handle);
  };
  const optionClass = (i: number) => cn("flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-start transition-colors pointer-coarse:py-2.5", i === active ? "bg-foreground/6" : "hover:bg-foreground/3");
  const listId = `${uid}-list`;
  const inputId = `${uid}-input`;

  return (
    <div className={cn("relative rounded-lg border border-border/60 bg-background/40 p-3 sm:p-4", className)}>
      <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]" htmlFor={inputId}>
        {t.label}
      </label>
      <textarea
        aria-activedescendant={open ? options[active]?.id : undefined}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
        className="mt-2 block w-full resize-none rounded-md border border-input bg-background px-3 py-2.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
        id={inputId}
        onChange={(e) => {
          setValue(e.target.value);
          setDismissed(false);
          setActiveIdx(0);
        }}
        onKeyDown={(e) => {
          if (!open) return;
          const current = options[active];
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => (i + 1) % options.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => (i - 1 + options.length) % options.length);
          } else if ((e.key === "Enter" || e.key === "Tab") && current) {
            e.preventDefault();
            insert(current);
          } else if (e.key === "Escape") {
            setDismissed(true);
          }
        }}
        role="combobox"
        rows={3}
        value={value}
      />
      {open ? (
        <div className="z-30 mt-2 overflow-hidden rounded-xl border border-border/70 bg-background shadow-2xl sm:absolute sm:inset-s-4 sm:top-full sm:mt-1 sm:w-80">
          <div aria-label={t.suggestions} className="max-h-[40svh] overflow-y-auto" id={listId} role="listbox">
            {people.length ? (
              <div className="px-3 py-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]" role="presentation">
                {t.people}
              </div>
            ) : null}
            {options.map((o, i) => (
              <Fragment key={o.id}>
                {o.kind === "group" && i === people.length ? (
                  <div className="border-border/60 border-t px-3 py-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]" role="presentation">
                    {t.groups}
                  </div>
                ) : null}
                <div aria-selected={i === active} className={optionClass(i)} id={o.id} onClick={() => insert(o)} onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      insert(o);
                    }
                  }} onMouseDown={(e) => e.preventDefault()} onPointerEnter={(e) => e.pointerType === "mouse" && setActiveIdx(i)} role="option" tabIndex={-1}>
                  {o.kind === "person" ? (
                    <>
                      <Avatar aria-hidden className="size-7">
                        <AvatarFallback className="text-[11px]">{initials(o.m.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate font-medium text-sm">{o.m.name}</span>
                          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">@{o.m.handle}</span>
                        </div>
                        {o.m.team ? <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{o.m.team}</div> : null}
                      </div>
                      {i === active ? <CornerDownLeftIcon aria-hidden className="size-3.5 opacity-60 pointer-coarse:hidden" /> : null}
                    </>
                  ) : (
                    <>
                      <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground/8 font-mono text-[11px]">
                        #
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm">@{o.g.handle}</div>
                        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{o.g.description}</div>
                      </div>
                    </>
                  )}
                </div>
              </Fragment>
            ))}
          </div>
          <div aria-hidden className="flex items-center justify-between gap-3 border-border/60 border-t bg-foreground/2 px-3 py-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] pointer-coarse:hidden">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border/60 bg-background/80 px-1 normal-case">↑</kbd>
              <kbd className="rounded border border-border/60 bg-background/80 px-1 normal-case">↓</kbd>
              {t.navigate}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border/60 bg-background/80 px-1 normal-case">↵</kbd>
              {t.insert}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function MentionComposer(props: MentionComposerProps) {
  return (
    <ScreenBoundary name="MentionComposer">
      <MentionComposerScreen {...props} />
    </ScreenBoundary>
  );
}
