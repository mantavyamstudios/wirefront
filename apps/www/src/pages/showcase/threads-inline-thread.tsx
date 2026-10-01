import { useState } from "react";
import { MessageSquareIcon, SmileIcon } from "lucide-react";
import { Button } from "@orbit/ui/button";
import { Sheet, SheetPopup, SheetTitle, SheetTrigger } from "@orbit/ui/sheet";

interface Comment {
  initials: string;
  tone: string;
  name: string;
  time: string;
  body: string;
}

const COMMENTS: Comment[] = [
  {
    initials: "MO",
    tone: "bg-emerald-500/85 text-white",
    name: "Maya Okafor",
    time: "10m",
    body: "Should we keep this paragraph? It's nicely written but covers the same ground as the diagram below.",
  },
  {
    initials: "JL",
    tone: "bg-amber-500/85 text-white",
    name: "James Lin",
    time: "8m",
    body: "I'd keep it. New readers don't always parse the diagram on first pass — the prose is the safety net.",
  },
];

// lg+: document with the thread in a margin rail. Below lg: one column; the
// anchored paragraph carries a comment badge that opens the same thread in a
// bottom sheet.
export function ThreadsInlineThreadShowcasePage() {
  const [comments, setComments] = useState(COMMENTS);
  const add = (body: string) =>
    setComments((c) => [
      ...c,
      { initials: "SB", tone: "bg-violet-500/85 text-white", name: "You", time: "now", body },
    ]);

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-4 py-8 sm:px-8 sm:py-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="min-w-0">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
            Doc · Engineering · Q3 planning
          </div>
          <h1 className="mt-1 font-heading text-2xl tracking-tight sm:text-3xl">
            How we ship.
          </h1>
          <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
            Three things have shaped how Orbit ships in the last quarter:
            tighter audit log retention, scoped invites, and the new pricing
            page. Each landed in under two weeks.
          </p>

          <div className="relative mt-4">
            <p
              id="anchored-paragraph"
              className="rounded-md bg-amber-500/[0.08] px-3 py-2 text-foreground/90 text-sm leading-relaxed ring-1 ring-amber-500/30"
            >
              We've been able to move quickly because the kernel is small and
              the scope of each change is narrow. When something fails, the blast
              radius is one bounded context — the auth, billing, or audit module.
            </p>
            <Sheet>
              <SheetTrigger
                aria-label={`Open thread, ${comments.length} comments`}
                className="-top-3 -right-2 absolute inline-flex min-h-8 items-center gap-1 rounded-full bg-amber-500 px-2.5 font-mono text-[11px] text-white shadow-sm lg:hidden pointer-coarse:min-h-10"
              >
                <MessageSquareIcon aria-hidden className="size-3" />
                {comments.length}
              </SheetTrigger>
              <SheetPopup side="bottom" className="max-h-[85svh] pb-[env(safe-area-inset-bottom)]">
                <SheetTitle className="sr-only">Comment thread</SheetTitle>
                <div className="overflow-y-auto p-4">
                  <Thread comments={comments} onReply={add} />
                </div>
              </SheetPopup>
            </Sheet>
          </div>

          <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
            That's the bet, anyway. The alternative — a single sprawling
            domain — looked appealing in the early days, but every refactor
            since has paid for itself in confidence.
          </p>

          <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
            Next quarter we're adding two more contexts: webhooks and the
            jobs runtime. Both are heavily tested in isolation already.
          </p>
        </article>

        <aside aria-label="Comments" className="border-border/60 border-l pl-6 max-lg:hidden">
          <Thread comments={comments} onReply={add} />
        </aside>
      </div>
    </div>
  );
}

function Thread({
  comments,
  onReply,
}: {
  comments: Comment[];
  onReply: (body: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const send = () => {
    if (!draft.trim()) return;
    onReply(draft.trim());
    setDraft("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
        <MessageSquareIcon aria-hidden className="size-3" />
        Thread · {comments.length} comments
      </div>

      <div className="mt-1 flex items-center gap-2 rounded-md bg-amber-500/[0.06] px-2.5 py-1 ring-1 ring-amber-500/20 lg:-ml-6 lg:rounded-l-none">
        <span aria-hidden className="size-1.5 rounded-full bg-amber-500" />
        <span className="font-mono text-[10px] text-amber-700 uppercase tracking-[0.25em] dark:text-amber-400">
          Anchored
        </span>
      </div>

      {comments.map((c, i) => (
        <article key={i} className="space-y-1">
          <div className="flex items-center gap-2">
            <div
              aria-hidden
              className={`flex size-6 shrink-0 items-center justify-center rounded-full font-medium text-[10px] ${c.tone}`}
            >
              {c.initials}
            </div>
            <span className="font-medium text-sm">{c.name}</span>
            <span className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.2em]">
              {c.time}
            </span>
          </div>
          <p className="ml-8 text-muted-foreground text-sm leading-relaxed">
            {c.body}
          </p>
          <div className="ml-6 flex items-center gap-1">
            <button
              type="button"
              aria-label={`React to ${c.name}`}
              className="inline-flex min-h-8 items-center gap-1 rounded px-2 font-mono text-[11px] text-muted-foreground/70 transition-colors hover:bg-foreground/[0.04] hover:text-foreground pointer-coarse:min-h-10"
            >
              <SmileIcon aria-hidden className="size-3" />
              React
            </button>
            <button
              type="button"
              className="min-h-8 rounded px-2 font-mono text-[11px] text-muted-foreground/70 transition-colors hover:bg-foreground/[0.04] hover:text-foreground pointer-coarse:min-h-10"
            >
              Reply
            </button>
          </div>
        </article>
      ))}

      <form
        className="mt-3 rounded-lg border border-border/60 bg-background/40 p-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
          }}
          aria-label="Reply to thread"
          placeholder="Reply…"
          enterKeyHint="send"
          className="h-9 w-full bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground sm:text-sm"
        />
        <div className="flex items-center justify-between gap-2 border-border/40 border-t pt-2">
          <span className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.25em] pointer-coarse:invisible">
            ⌘ + ↵ to send
          </span>
          <Button size="sm" type="submit" disabled={!draft.trim()}>
            Send
          </Button>
        </div>
      </form>

      <button
        type="button"
        className="min-h-8 rounded px-1.5 font-mono text-[11px] text-muted-foreground/70 transition-colors hover:text-foreground pointer-coarse:min-h-10"
      >
        Resolve thread
      </button>
    </div>
  );
}
