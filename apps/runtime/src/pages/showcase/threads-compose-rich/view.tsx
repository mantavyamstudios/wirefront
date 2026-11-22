// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { Kbd } from "@wirefront/ui/kbd";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
} from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import {
  AtSignIcon,
  BoldIcon,
  CodeIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  PaperclipIcon,
  StrikethroughIcon,
  XIcon,
} from "lucide-react";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import type { Attachment, ReplyTarget } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("richComposer.<key>"). */
export const RICH_COMPOSER_MESSAGES = {
  toolbar: "Formatting",
  bold: "Bold",
  italic: "Italic",
  strike: "Strikethrough",
  code: "Code",
  link: "Link",
  list: "List",
  attach: "Attach",
  image: "Image",
  mention: "Mention",
  markdown: "Markdown",
  replyLabel: "Reply",
  placeholder: "Reply to the thread…",
  remove: "Remove {name}",
  replyingTo: "Replying to",
  target: "{name} · {when}",
  send: "send",
  cancel: "Cancel",
  submit: "Reply",
};

export type Format = "bold" | "italic" | "strike" | "code" | "link" | "list";

/** Applies a markdown format to the selection and returns the new text and selection. */
export function applyFormat(
  text: string,
  start: number,
  end: number,
  format: Format
): { text: string; start: number; end: number } {
  const selected = text.slice(start, end);
  if (format === "list") {
    const from = text.lastIndexOf("\n", start - 1) + 1;
    const block = text
      .slice(from, end)
      .split("\n")
      .map((line) => `- ${line}`)
      .join("\n");
    const next = text.slice(0, from) + block + text.slice(end);
    return { text: next, start: from, end: from + block.length };
  }
  if (format === "link") {
    const label = selected || "link";
    const inserted = `[${label}](https://)`;
    const urlAt = start + label.length + 3;
    return {
      text: text.slice(0, start) + inserted + text.slice(end),
      start: urlAt,
      end: urlAt + 8,
    };
  }
  const mark = { bold: "**", italic: "_", strike: "~~", code: "`" }[format];
  const next = text.slice(0, start) + mark + selected + mark + text.slice(end);
  return { text: next, start: start + mark.length, end: end + mark.length };
}

const SHORTCUTS: Record<string, Format> = {
  b: "bold",
  i: "italic",
  e: "code",
  k: "link",
};

export interface RichComposerProps {
  defaultValue?: string;
  /** The comment being answered, shown under the box. */
  replyingTo?: ReplyTarget;
  attachments?: Attachment[];
  /** Upload the picked files and add them to attachments. Attach and Image are hidden without it. */
  onAttach?: (files: File[]) => void;
  onRemoveAttachment?: (id: string) => void;
  /** Posts the reply (markdown). The box clears when it succeeds. */
  onSubmit: Action<{ body: string }>;
  /** Hidden without it. */
  onCancel?: () => void;
  className?: string;
}

const tool =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-10";

function RichComposerScreen({
  defaultValue = "",
  replyingTo,
  attachments = [],
  onAttach,
  onRemoveAttachment,
  onSubmit,
  onCancel,
  className,
}: RichComposerProps) {
  const t = useMessages("richComposer", RICH_COMPOSER_MESSAGES);
  const fmt = useFormat();
  const [draft, setDraft] = useState(defaultValue);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  // Selection to restore after a toolbar edit re-renders the textarea.
  const selection = useRef<[number, number] | null>(null);
  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!area || !selection.current) return;
    area.focus();
    area.setSelectionRange(...selection.current);
    selection.current = null;
  });
  const submit = useAction(onSubmit, { onSuccess: () => setDraft("") });
  const edit = (next: string, start: number, end: number) => {
    selection.current = [start, end];
    setDraft(next);
  };
  const format = (f: Format) => {
    const area = areaRef.current;
    const r = applyFormat(
      draft,
      area?.selectionStart ?? draft.length,
      area?.selectionEnd ?? draft.length,
      f
    );
    edit(r.text, r.start, r.end);
  };
  const mention = () => {
    const at = areaRef.current?.selectionStart ?? draft.length;
    const pre = at > 0 && !/\s/.test(draft[at - 1] ?? "") ? " @" : "@";
    edit(
      draft.slice(0, at) + pre + draft.slice(at),
      at + pre.length,
      at + pre.length
    );
  };
  const send = () => {
    const body = draft.trim();
    if (body && !submit.isPending()) submit.run({ body });
  };
  const tools: {
    format: Format;
    label: string;
    icon: ReactNode;
    shortcut?: string;
  }[] = [
    { format: "bold", label: t.bold, icon: <BoldIcon />, shortcut: "⌘B" },
    { format: "italic", label: t.italic, icon: <ItalicIcon />, shortcut: "⌘I" },
    { format: "strike", label: t.strike, icon: <StrikethroughIcon /> },
    { format: "code", label: t.code, icon: <CodeIcon />, shortcut: "⌘E" },
    { format: "link", label: t.link, icon: <LinkIcon />, shortcut: "⌘K" },
    { format: "list", label: t.list, icon: <ListIcon /> },
  ];
  const pick = (files: FileList | null) => {
    if (files?.length) onAttach?.([...files]);
  };

  return (
    <div className={className}>
      <div className="rounded-xl border border-border/60 bg-background/40 p-3 shadow-sm focus-within:border-foreground/40">
        {/* The toolbar wraps onto a second line on narrow screens so every tool stays visible. */}
        <div className="flex items-center justify-between gap-2 border-border/40 border-b pb-2">
          <div
            aria-label={t.toolbar}
            className="flex min-w-0 flex-wrap items-center gap-0.5 [&_svg]:size-3.5"
            role="toolbar"
          >
            {tools.map((x) => (
              <button
                aria-label={x.label}
                className={tool}
                key={x.format}
                onClick={() => format(x.format)}
                title={x.shortcut ? `${x.label} (${x.shortcut})` : x.label}
                type="button"
              >
                <span aria-hidden className="contents">
                  {x.icon}
                </span>
              </button>
            ))}
            <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-border/60" />
            {onAttach ? (
              <>
                <button
                  aria-label={t.attach}
                  className={tool}
                  onClick={() => fileRef.current?.click()}
                  title={t.attach}
                  type="button"
                >
                  <PaperclipIcon aria-hidden />
                </button>
                <button
                  aria-label={t.image}
                  className={tool}
                  onClick={() => imageRef.current?.click()}
                  title={t.image}
                  type="button"
                >
                  <ImageIcon aria-hidden />
                </button>
                <input
                  className="hidden"
                  multiple
                  onChange={(e) => pick(e.target.files)}
                  ref={fileRef}
                  tabIndex={-1}
                  type="file"
                />
                <input
                  accept="image/*"
                  className="hidden"
                  multiple
                  onChange={(e) => pick(e.target.files)}
                  ref={imageRef}
                  tabIndex={-1}
                  type="file"
                />
              </>
            ) : null}
            <button
              aria-label={t.mention}
              className={tool}
              onClick={mention}
              title={t.mention}
              type="button"
            >
              <AtSignIcon aria-hidden />
            </button>
          </div>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] max-sm:hidden">
            {t.markdown}
          </span>
        </div>
        <textarea
          aria-label={t.replyLabel}
          className="mt-2 w-full resize-none bg-transparent px-1 text-base leading-relaxed outline-none placeholder:text-muted-foreground sm:text-sm"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (!(e.metaKey || e.ctrlKey)) return;
            if (e.key === "Enter") {
              e.preventDefault();
              send();
              return;
            }
            const f = SHORTCUTS[e.key.toLowerCase()];
            if (f) {
              e.preventDefault();
              format(f);
            }
          }}
          placeholder={t.placeholder}
          ref={areaRef}
          rows={5}
          value={draft}
        />
        {attachments.length ? (
          <ul className="mt-2 flex flex-wrap items-center gap-2">
            {attachments.map((a) => (
              <li
                className="flex max-w-full items-center gap-1.5 rounded-md border border-border/60 bg-background/40 py-0.5 ps-2 pe-0.5 text-xs"
                key={a.id}
              >
                <PaperclipIcon
                  aria-hidden
                  className="size-3 shrink-0 opacity-60"
                />
                <span className="min-w-0 truncate font-mono text-[11px]">
                  {a.name}
                </span>
                {onRemoveAttachment ? (
                  <button
                    aria-label={interpolate(t.remove, { name: a.name })}
                    className="grid size-7 shrink-0 place-items-center rounded text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-9"
                    onClick={() => onRemoveAttachment(a.id)}
                    type="button"
                  >
                    <XIcon aria-hidden className="size-3" />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        {submit.error ? (
          <p className="mt-2 text-destructive text-xs" role="alert">
            {submit.error}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-border/40 border-t pt-2">
          <div className="flex min-w-0 items-center gap-2">
            {replyingTo ? (
              <>
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                  {t.replyingTo}
                </span>
                <span className="rounded bg-foreground/6 px-1.5 py-0.5 font-mono text-[10px] text-foreground/85">
                  {interpolate(t.target, {
                    name: replyingTo.name,
                    when: fmt.relative(replyingTo.createdAt),
                  })}
                </span>
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="hidden font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] sm:flex sm:items-center sm:gap-1.5 pointer-coarse:hidden"
            >
              <Kbd>⌘</Kbd>
              <Kbd>↵</Kbd>
              {t.send}
            </span>
            {onCancel ? (
              <Button
                onClick={onCancel}
                size="sm"
                type="button"
                variant="ghost"
              >
                {t.cancel}
              </Button>
            ) : null}
            <Button
              disabled={!draft.trim() || submit.isPending()}
              onClick={send}
              size="sm"
              type="button"
            >
              {t.submit}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RichComposer(props: RichComposerProps) {
  return (
    <ScreenBoundary name="RichComposer">
      <RichComposerScreen {...props} />
    </ScreenBoundary>
  );
}
