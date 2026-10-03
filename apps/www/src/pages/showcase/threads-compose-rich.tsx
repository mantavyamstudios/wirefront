import { useState } from "react";
import {
  AtSignIcon,
  BoldIcon,
  CodeIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  PaperclipIcon,
  SmileIcon,
  StrikethroughIcon,
} from "lucide-react";
import { Button } from "@orbit/ui/button";
import { Kbd } from "@orbit/ui/kbd";

const TOOLS = [
  { Icon: BoldIcon, label: "Bold", shortcut: "⌘B" },
  { Icon: ItalicIcon, label: "Italic", shortcut: "⌘I" },
  { Icon: StrikethroughIcon, label: "Strike" },
  { Icon: CodeIcon, label: "Code", shortcut: "⌘E" },
  { Icon: LinkIcon, label: "Link", shortcut: "⌘K" },
  { Icon: ListIcon, label: "List" },
];

export function ThreadsComposeRichShowcasePage() {
  const [draft, setDraft] = useState(
    "Sounds good. I'll land it tonight after CI passes — should be a clean migration.",
  );

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-16">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          Composer
        </div>
        <h1 className="mt-1 font-heading text-2xl sm:text-3xl">Rich reply box</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Markdown shortcuts in the toolbar, mention popover behind{" "}
          <Kbd>@</Kbd>, attachments and emoji within reach.
        </p>

        <div className="mt-8 rounded-xl border sm:mt-10 border-border/60 bg-background/40 p-3 shadow-sm focus-within:border-foreground/40">
          {/* The toolbar wraps onto a second line on narrow screens so every tool stays visible. */}
          <div className="flex items-center justify-between gap-2 border-border/40 border-b pb-2">
            <div
              role="toolbar"
              aria-label="Formatting"
              className="flex min-w-0 flex-wrap items-center gap-0.5"
            >
              {TOOLS.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  title={t.shortcut ? `${t.label} (${t.shortcut})` : t.label}
                  aria-label={t.label}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground pointer-coarse:size-10 transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
                >
                  <t.Icon className="size-3.5" />
                </button>
              ))}
              <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-border/60" />
              <button
                type="button"
                title="Attach"
                aria-label="Attach"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground pointer-coarse:size-10 transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
              >
                <PaperclipIcon className="size-3.5" />
              </button>
              <button
                type="button"
                title="Image"
                aria-label="Image"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground pointer-coarse:size-10 transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
              >
                <ImageIcon className="size-3.5" />
              </button>
              <button
                type="button"
                title="Mention"
                aria-label="Mention"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground pointer-coarse:size-10 transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
              >
                <AtSignIcon className="size-3.5" />
              </button>
              <button
                type="button"
                title="Emoji"
                aria-label="Emoji"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground pointer-coarse:size-10 transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
              >
                <SmileIcon className="size-3.5" />
              </button>
            </div>
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.25em] max-sm:hidden">
              Markdown
            </span>
          </div>

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            aria-label="Reply"
            placeholder="Reply to the thread…"
            className="mt-2 w-full resize-none bg-transparent px-1 text-base sm:text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
          />

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="flex max-w-full items-center gap-1.5 rounded-md border border-border/60 bg-background/40 py-0.5 pr-0.5 pl-2 text-xs">
              <PaperclipIcon aria-hidden className="size-3 shrink-0 opacity-60" />
              <span className="min-w-0 truncate font-mono text-[11px]">migration-plan.md</span>
              <button
                type="button"
                className="grid size-7 shrink-0 place-items-center rounded text-muted-foreground/60 transition-colors hover:text-foreground pointer-coarse:size-9"
                aria-label="Remove migration-plan.md"
              >
                ×
              </button>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-border/40 border-t pt-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.25em]">
                Replying to
              </span>
              <span className="rounded bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-foreground/85">
                Maya · 2h ago
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.25em] sm:flex sm:items-center sm:gap-1.5 pointer-coarse:hidden">
                <Kbd>⌘</Kbd>
                <Kbd>↵</Kbd>
                send
              </span>
              <Button variant="ghost" size="sm" type="button">
                Cancel
              </Button>
              <Button size="sm" type="button" disabled={!draft.trim()}>
                Reply
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
