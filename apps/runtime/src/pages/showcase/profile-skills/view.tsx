// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { PlusIcon, ThumbsUpIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { Skill } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("skillEndorsements.<key>"). */
export const SKILL_ENDORSEMENTS_MESSAGES = {
  eyebrow: "{person} · skills",
  title: "Skills & endorsements",
  summary: "{endorsements} endorsements across {skills} skills.",
  proficiency: "Proficiency {level} of 5",
  endorsements: "endorsements",
  endorse: "Endorse",
  endorseSkill: "Endorse {skill}",
  addSkill: "Add a skill",
  empty: "No skills listed yet.",
  errorTitle: "Couldn’t load skills",
  retry: "Try again",
};

export interface SkillEndorsementsProps {
  /** Whose skills these are, for the header. */
  person: string;
  /** Their skills. Leave it out while they load. */
  skills?: Skill[];
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Endorse (true) or withdraw (false). The count changes at once and reverts if this fails. Hidden without it. */
  onEndorse?: Action<{ id: string; endorsed: boolean }>;
  /** Open your add-skill flow. Hidden without it. */
  onAddSkill?: () => void;
  className?: string;
}

const LEVELS = [1, 2, 3, 4, 5];

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function SkillEndorsementsScreen({ person, skills, status = "ready", error, onRetry, onEndorse, onAddSkill, className }: SkillEndorsementsProps) {
  const t = useMessages("skillEndorsements", SKILL_ENDORSEMENTS_MESSAGES);
  const fmt = useFormat();
  const [list, setList] = useState(skills ?? []);
  useEffect(() => setList(skills ?? []), [skills]);
  const endorse = useAction(onEndorse ?? (async () => {}), {
    optimistic: ({ id, endorsed }) => {
      const flip = (on: boolean) => setList((all) => all.map((s) => (s.id === id ? { ...s, endorsedByMe: on, endorsements: s.endorsements + (on ? 1 : -1) } : s)));
      flip(endorsed);
      return () => flip(!endorsed);
    },
  });
  const categories = [...new Set(list.map((s) => s.category))];
  const total = list.reduce((sum, s) => sum + s.endorsements, 0);

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-3xl">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{interpolate(t.eyebrow, { person })}</div>
        <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
        {skills && status === "ready" ? <p className="mt-1 text-muted-foreground text-sm">{interpolate(t.summary, { endorsements: fmt.number(total), skills: list.length })}</p> : null}
        {endorse.error ? (
          <p className="mt-3 text-destructive-foreground text-sm" role="alert">
            {endorse.error}
          </p>
        ) : null}

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
        ) : !skills || status === "loading" ? (
          <div aria-busy="true" className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {["a", "b", "c", "d"].map((k) => (
              <Skeleton className="h-20 w-full rounded-xl motion-reduce:animate-none" key={k} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="mt-8 rounded-xl border border-border/60 py-12 text-center text-muted-foreground text-sm">{t.empty}</p>
        ) : (
          categories.map((cat) => {
            const inCat = list.filter((s) => s.category === cat);
            return (
              <section aria-label={cat} className="mt-8" key={cat}>
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="font-heading text-base">{cat}</h2>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{inCat.length}</span>
                  <span aria-hidden className="ms-auto h-px flex-1 bg-border/40" />
                </div>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {inCat.map((s) => (
                    <li className="rounded-xl border border-border/60 bg-background/40 px-3.5 py-2.5 transition-colors hover:bg-background/60" key={s.id}>
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="min-w-0 break-words font-normal text-sm">{s.name}</h3>
                        <div aria-label={interpolate(t.proficiency, { level: s.level })} className="flex shrink-0 items-center gap-0.5" role="img">
                          {LEVELS.map((n) => (
                            <span className={cn("size-1.5 rounded-full", n <= s.level ? "bg-foreground" : "bg-muted-foreground/25")} key={n} />
                          ))}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center -space-x-1.5">
                          {s.endorsers.slice(0, 4).map((e) => (
                            <Avatar aria-hidden className="size-5 border-2 border-background" key={e}>
                              <AvatarFallback className="text-[10px]">{initials(e)}</AvatarFallback>
                            </Avatar>
                          ))}
                          <span className="ms-3 font-mono text-[10px] text-muted-foreground tabular-nums">
                            {fmt.number(s.endorsements)}
                            <span className="sr-only"> {t.endorsements}</span>
                          </span>
                        </div>
                        {onEndorse ? (
                          <button
                            aria-pressed={s.endorsedByMe}
                            className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-md bg-foreground/[0.04] px-2.5 py-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] outline-none hover:bg-foreground/[0.08] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-foreground aria-pressed:text-background pointer-coarse:min-h-10"
                            disabled={endorse.isPending(s.id)}
                            onClick={() => void endorse.run({ id: s.id, endorsed: !s.endorsedByMe }, s.id)}
                            type="button"
                          >
                            <ThumbsUpIcon aria-hidden className="size-3" />
                            <span className="sr-only">{interpolate(t.endorseSkill, { skill: s.name })}</span>
                            <span aria-hidden>{t.endorse}</span>
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
        {onAddSkill && skills ? (
          <button
            className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-md border border-border/70 border-dashed px-3 py-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] outline-none hover:border-foreground/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            onClick={onAddSkill}
            type="button"
          >
            <PlusIcon aria-hidden className="size-3.5" />
            {t.addSkill}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function SkillEndorsements(props: SkillEndorsementsProps) {
  return (
    <ScreenBoundary name="SkillEndorsements">
      <SkillEndorsementsScreen {...props} />
    </ScreenBoundary>
  );
}
