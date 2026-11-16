// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@wirefront/ui/avatar";
import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import { Card, CardContent } from "@wirefront/ui/card";
import { cn } from "@wirefront/ui/lib/utils";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { BookmarkIcon, ClockIcon } from "lucide-react";
import { useState } from "react";

import type { ArticleTeaser, SaveArticleInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("articleCards.<key>"). */
export const ARTICLE_CARDS_MESSAGES = {
  title: "Latest from the journal",
  description: "Notes from the team on engineering, design, and product.",
  readTime: "{count} min read",
  save: "Save “{title}” for later",
};

export interface ArticleCardsProps {
  articles: ArticleTeaser[];
  /** Save or unsave (saveArticle). Applied at once and rolled back if it fails. The bookmark hides without it. */
  onSave?: Action<SaveArticleInput>;
  className?: string;
}

const COVERS = [
  "radial-gradient(120% 100% at 20% 20%, color-mix(in srgb, var(--category-3) 55%, transparent), transparent 60%), radial-gradient(120% 100% at 80% 80%, color-mix(in srgb, var(--category-4) 70%, transparent), transparent 60%)",
  "radial-gradient(120% 100% at 20% 20%, color-mix(in srgb, var(--category-2) 45%, transparent), transparent 60%), radial-gradient(120% 100% at 80% 80%, color-mix(in srgb, var(--category-8) 70%, transparent), transparent 60%)",
  "radial-gradient(120% 100% at 20% 20%, color-mix(in srgb, var(--category-4) 35%, transparent), transparent 60%), radial-gradient(120% 100% at 80% 80%, color-mix(in srgb, var(--category-5) 70%, transparent), transparent 60%)",
];
const DOTS = Array.from({ length: 40 }, (_, i) => ({ key: `dot-${i % 10}-${Math.floor(i / 10)}`, x: (i % 10) * 10 + 5, y: Math.floor(i / 10) * 14 + 7 }));

/** One of three decorative patterns over a generated cover. */
function Pattern({ kind }: { kind: number }) {
  if (kind === 0)
    return (
      <svg aria-hidden className="absolute inset-0 h-full w-full text-foreground/30 mix-blend-overlay" viewBox="0 0 100 56">
        {DOTS.map((d) => (
          <circle cx={d.x} cy={d.y} fill="currentColor" key={d.key} r={0.9} />
        ))}
      </svg>
    );
  if (kind === 1)
    return (
      <div
        aria-hidden
        className="absolute inset-0 mix-blend-overlay"
        style={{ backgroundImage: "repeating-linear-gradient(135deg, color-mix(in srgb, currentColor 18%, transparent) 0 1px, transparent 1px 12px)" }}
      />
    );
  return (
    <svg aria-hidden className="absolute inset-0 h-full w-full text-foreground/35 mix-blend-overlay" viewBox="0 0 100 56">
      {[8, 16, 24, 32].map((r) => (
        <circle cx={20} cy={56} fill="none" key={r} r={r} stroke="currentColor" strokeWidth="0.5" />
      ))}
    </svg>
  );
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

function ArticleCardsScreen({ articles, onSave, className }: ArticleCardsProps) {
  const t = useMessages("articleCards", ARTICLE_CARDS_MESSAGES);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const save = useAction(onSave ?? (async () => {}), {
    optimistic: ({ articleId, saved: next }) => {
      setSaved((s) => ({ ...s, [articleId]: next }));
      return () => setSaved((s) => ({ ...s, [articleId]: !next }));
    },
  });

  return (
    <div className={cn("min-h-svh bg-background px-4 py-8 sm:px-6 sm:py-12", className)}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <h1 className="font-heading text-xl">{t.title}</h1>
          <p className="text-muted-foreground text-sm">{t.description}</p>
        </header>
        {save.error ? (
          <p className="mb-3 text-destructive-foreground text-sm" role="alert">
            {save.error}
          </p>
        ) : null}

        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a, i) => {
            const isSaved = saved[a.id] ?? a.saved;
            return (
              <li key={a.id}>
                <Card className="relative h-full overflow-hidden transition-shadow focus-within:ring-2 focus-within:ring-ring hover:shadow-md">
                  {a.coverUrl ? (
                    <img alt="" className="aspect-[16/9] w-full object-cover" src={a.coverUrl} />
                  ) : (
                    <div aria-hidden className="relative aspect-[16/9] w-full bg-muted" style={{ background: `${COVERS[i % COVERS.length]}, var(--muted)` }}>
                      <Pattern kind={i % 3} />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2">
                      <Badge className="font-mono text-[10px] uppercase tracking-wider" variant="secondary">
                        {a.category}
                      </Badge>
                      <span className="ms-auto inline-flex items-center gap-1 text-muted-foreground text-xs">
                        <ClockIcon aria-hidden className="size-3" />
                        {interpolate(t.readTime, { count: a.readMinutes })}
                      </span>
                    </div>
                    <h2 className="mt-3 font-heading font-semibold text-lg leading-snug">
                      {/* The title's link covers the card, so the whole card opens the article. */}
                      <WirefrontLink className="outline-none after:absolute after:inset-0 after:content-['']" href={a.href}>
                        {a.title}
                      </WirefrontLink>
                    </h2>
                    <p className="mt-1.5 line-clamp-2 text-muted-foreground text-sm">{a.excerpt}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          {a.author.avatarUrl ? <AvatarImage alt="" src={a.author.avatarUrl} /> : null}
                          <AvatarFallback className="bg-muted text-[10px]">{initialsOf(a.author.name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-foreground text-xs">{a.author.name}</span>
                      </div>
                      {onSave ? (
                        <Button
                          aria-label={interpolate(t.save, { title: a.title })}
                          aria-pressed={isSaved}
                          className="relative z-10 text-muted-foreground aria-pressed:text-foreground"
                          disabled={save.isPending(a.id)}
                          onClick={() => void save.run({ articleId: a.id, saved: !isSaved }, a.id)}
                          size="icon-sm"
                          variant="ghost"
                        >
                          <BookmarkIcon className={cn(isSaved && "fill-current")} />
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function ArticleCards(props: ArticleCardsProps) {
  return (
    <ScreenBoundary name="ArticleCards">
      <ArticleCardsScreen {...props} />
    </ScreenBoundary>
  );
}
