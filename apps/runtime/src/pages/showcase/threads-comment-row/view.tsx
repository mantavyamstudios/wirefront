// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@wirefront/ui/dropdown-menu";
import { cn } from "@wirefront/ui/lib/utils";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { MoreHorizontalIcon, SmilePlusIcon } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import type { Comment, RowReaction } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("commentRow.<key>"). */
export const COMMENT_ROW_MESSAGES = {
  edited: "edited",
  more: "More actions for {name}’s comment",
  copyLink: "Copy link",
  edit: "Edit",
  delete: "Delete",
  reaction: "{emoji} {count} reactions",
  reactionOne: "{emoji} 1 reaction",
  addReaction: "Add reaction",
  replies: "{count} replies",
  repliesOne: "1 reply",
  reply: "Reply",
};

/** Reactions offered by the add-reaction menu unless you pass your own. */
export const DEFAULT_ROW_REACTIONS = ["👍", "👀", "🚀", "🎉", "❤️"];

export interface CommentRowProps {
  comment: Comment;
  /** Adds or removes the user's reaction; reactions are read-only without it. */
  onReact?: Action<{ commentId: string; emoji: string; mine: boolean }>;
  reactionChoices?: string[];
  /** Each of these shows its control only when given. */
  onReply?: (id: string) => void;
  onOpenReplies?: (id: string) => void;
  onCopyLink?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
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

/** Plain text with `code` and @mentions highlighted. */
function RichText({ text }: { text: string }) {
  let at = 0;
  return text.split(/(`[^`]+`|(?<![\w.])@[\w.-]+)/g).filter(Boolean).map((part) => {
    const key = at;
    at += part.length;
    if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) return <code key={key}>{part.slice(1, -1)}</code>;
    if (part.length > 1 && part.startsWith("@")) return <span className="rounded bg-primary/15 px-1.5 py-0.5 font-medium text-primary text-xs" key={key}>{part}</span>;
    return <Fragment key={key}>{part}</Fragment>;
  });
}

function toggleReaction(list: RowReaction[], emoji: string, mine: boolean): RowReaction[] {
  const found = list.find((r) => r.emoji === emoji);
  if (!found) return mine ? [...list, { emoji, count: 1, mine: true }] : list;
  return list.map((r) => (r.emoji === emoji ? { ...r, mine, count: r.count + (mine ? 1 : -1) } : r)).filter((r) => r.count > 0);
}

const quiet = "min-h-8 rounded px-1.5 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10";

// The ⋯ menu is revealed on hover for mouse users, but is always visible on touch screens and
// whenever focus is inside the row. Reactions toggle optimistically.
function CommentRowScreen({ comment: c, onReact, reactionChoices = DEFAULT_ROW_REACTIONS, onReply, onOpenReplies, onCopyLink, onEdit, onDelete, className }: CommentRowProps) {
  const t = useMessages("commentRow", COMMENT_ROW_MESSAGES);
  const fmt = useFormat();
  const [reactions, setReactions] = useState(c.reactions);
  useEffect(() => setReactions(c.reactions), [c.reactions]);
  const react = useAction(onReact ?? (async () => {}), {
    optimistic: ({ emoji, mine }) => {
      setReactions((rs) => toggleReaction(rs, emoji, mine));
      return () => setReactions((rs) => toggleReaction(rs, emoji, !mine));
    },
  });
  const hasMenu = Boolean(onCopyLink || onEdit || onDelete);

  return (
    <article className={cn("group rounded-lg border border-border/60 bg-background/40 p-3 transition-colors hover:border-border sm:p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar aria-hidden className="size-8">
            <AvatarFallback className="text-xs">{initials(c.author.name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{c.author.name}</span>
              {c.editedAt ? <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{t.edited}</span> : null}
            </div>
            <time className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]" dateTime={c.createdAt}>
              {fmt.relative(c.createdAt)}
            </time>
          </div>
        </div>
        {hasMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger aria-label={interpolate(t.more, { name: c.author.name })} className="-me-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 outline-none transition-all hover:bg-foreground/[0.05] hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring group-focus-within:opacity-100 group-hover:opacity-100 data-popup-open:opacity-100 pointer-coarse:size-10 pointer-coarse:opacity-100">
              <MoreHorizontalIcon aria-hidden className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onCopyLink ? <DropdownMenuItem onClick={() => onCopyLink(c.id)}>{t.copyLink}</DropdownMenuItem> : null}
              {onEdit ? <DropdownMenuItem onClick={() => onEdit(c.id)}>{t.edit}</DropdownMenuItem> : null}
              {onDelete ? (
                <DropdownMenuItem onClick={() => onDelete(c.id)} variant="destructive">
                  {t.delete}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      <p className="mt-2.5 text-foreground/90 text-sm leading-relaxed [&_code]:rounded [&_code]:bg-foreground/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px]">
        <RichText text={c.body} />
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {reactions.map((r) => (
          <button
            aria-label={interpolate(r.count === 1 ? t.reactionOne : t.reaction, { emoji: r.emoji, count: r.count })}
            aria-pressed={Boolean(r.mine)}
            className={cn("inline-flex min-h-7 items-center gap-1 rounded-full border px-2 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default pointer-coarse:min-h-9", r.mine ? "border-foreground/30 bg-foreground/[0.06]" : "border-border/60 bg-background/40 hover:border-border")}
            disabled={!onReact}
            key={r.emoji}
            onClick={() => react.run({ commentId: c.id, emoji: r.emoji, mine: !r.mine }, r.emoji)}
            type="button"
          >
            <span aria-hidden>{r.emoji}</span>
            <span aria-hidden className="font-mono text-[10px]">{r.count}</span>
          </button>
        ))}
        {onReact ? (
          <DropdownMenu>
            <DropdownMenuTrigger aria-label={t.addReaction} className="inline-flex size-7 items-center justify-center rounded-full border border-border/60 bg-background/40 text-muted-foreground outline-none transition-colors hover:border-border hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-9">
              <SmilePlusIcon aria-hidden className="size-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="flex min-w-0 gap-0.5 p-1">
              {reactionChoices.map((emoji) => (
                <DropdownMenuItem className="justify-center px-2 text-base" key={emoji} onClick={() => react.run({ commentId: c.id, emoji, mine: true }, emoji)}>
                  {emoji}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <span className="ms-auto inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.15em]">
          {c.replyCount > 0 && onOpenReplies ? (
            <button className={quiet} onClick={() => onOpenReplies(c.id)} type="button">
              {c.replyCount === 1 ? t.repliesOne : interpolate(t.replies, { count: c.replyCount })}
            </button>
          ) : null}
          {onReply ? (
            <button className={quiet} onClick={() => onReply(c.id)} type="button">
              {t.reply}
            </button>
          ) : null}
        </span>
      </div>
      {react.error ? (
        <p className="mt-2 text-destructive text-xs" role="alert">
          {react.error}
        </p>
      ) : null}
    </article>
  );
}

export function CommentRow(props: CommentRowProps) {
  return (
    <ScreenBoundary name="CommentRow">
      <CommentRowScreen {...props} />
    </ScreenBoundary>
  );
}
