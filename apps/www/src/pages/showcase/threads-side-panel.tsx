import {
  ChevronDownIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@orbit/ui/button";
import {
  Sheet,
  SheetClose,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@orbit/ui/sheet";

interface Comment {
  id: number;
  initials: string;
  tone: string;
  name: string;
  time: string;
  body: string;
  reactions?: { emoji: string; count: number; mine?: boolean }[];
}

const THREAD: Comment[] = [
  {
    id: 1,
    initials: "MO",
    tone: "bg-emerald-500/85 text-white",
    name: "Maya Okafor",
    time: "1h",
    body: "I rewrote the audit log query — should we land it tonight or wait for the freeze to lift on Tuesday?",
    reactions: [
      { emoji: "👀", count: 3 },
      { emoji: "🚀", count: 2, mine: true },
    ],
  },
  {
    id: 2,
    initials: "JL",
    tone: "bg-amber-500/85 text-white",
    name: "James Lin",
    time: "52m",
    body: "Tonight if it's idempotent. Otherwise I'd wait — I don't want to chase down a partial backfill on Saturday.",
  },
  {
    id: 3,
    initials: "MO",
    tone: "bg-emerald-500/85 text-white",
    name: "Maya Okafor",
    time: "44m",
    body: "Idempotent — re-runs will skip seen entries. Tested against staging this morning.",
  },
  {
    id: 4,
    initials: "RP",
    tone: "bg-violet-500/85 text-white",
    name: "Riya Patel",
    time: "39m",
    body: "+1 from me. Also: can you tag the migration with `audit-q3` so we can roll back cleanly if needed?",
    reactions: [{ emoji: "👍", count: 2, mine: true }],
  },
];

const PARTICIPANTS = [
  { initials: "MO", tone: "bg-emerald-500/85 text-white" },
  { initials: "JL", tone: "bg-amber-500/85 text-white" },
  { initials: "RP", tone: "bg-violet-500/85 text-white" },
  { initials: "SC", tone: "bg-foreground text-background" },
];

// A real Sheet (focus trap, Esc, labelled) that opens on load for the
// showcase: full-width on phones, 420px from sm. The composer sits above the
// home indicator.
export function ThreadsSidePanelShowcasePage() {
  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <Sheet defaultOpen>
        <FakeApp />

        <SheetPopup
          side="right"
          showCloseButton={false}
          className="h-svh w-full max-w-none sm:max-w-[420px]"
        >
          <header className="border-border/60 border-b px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <MessageSquareIcon
                  aria-hidden
                  className="size-3.5 shrink-0 opacity-70"
                />
                <SheetTitle className="font-medium text-sm">
                  Conversation
                </SheetTitle>
                <span className="rounded-full bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                  {THREAD.length} replies
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="More options"
                  className="grid size-8 place-items-center rounded-md text-muted-foreground pointer-coarse:size-10 transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
                >
                  <MoreHorizontalIcon className="size-3.5" />
                </button>
                <SheetClose
                  aria-label="Close conversation"
                  className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground pointer-coarse:size-10"
                >
                  <XIcon className="size-3.5" />
                </SheetClose>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <div
                aria-label={`${PARTICIPANTS.length} participants`}
                className="flex items-center -space-x-1.5"
              >
                {PARTICIPANTS.map((p, i) => (
                  <span
                    key={i}
                    className={`flex size-5 items-center justify-center rounded-full ring-2 ring-background font-medium text-[10px] ${p.tone}`}
                  >
                    {p.initials}
                  </span>
                ))}
              </div>
              <div className="min-w-0 truncate font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                On · API audit log query
              </div>
              <button
                type="button"
                aria-haspopup="menu"
                className="ml-auto inline-flex min-h-8 items-center gap-1 rounded px-2 font-mono text-[10px] pointer-coarse:min-h-10 text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
              >
                Subscribed
                <ChevronDownIcon className="size-3" />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {THREAD.map((c) => (
              <article key={c.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div
                    aria-hidden
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full font-medium text-[11px] ${c.tone}`}
                  >
                    {c.initials}
                  </div>
                  <span className="font-medium text-sm">{c.name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.2em]">
                    {c.time}
                  </span>
                </div>
                <p className="ml-9 text-muted-foreground text-sm leading-relaxed">
                  {c.body}
                </p>
                {c.reactions ? (
                  <div className="ml-9 flex flex-wrap items-center gap-1.5 pt-1">
                    {c.reactions.map((r, i) => (
                      <button
                        key={i}
                        type="button"
                        aria-pressed={!!r.mine}
                        aria-label={`${r.emoji} ${r.count} reactions`}
                        className={`inline-flex min-h-7 items-center gap-1 rounded-full border px-2 text-xs transition-colors pointer-coarse:min-h-9 ${
                          r.mine
                            ? "border-foreground/30 bg-foreground/[0.06]"
                            : "border-border/60 bg-background/40 hover:border-border"
                        }`}
                      >
                        <span>{r.emoji}</span>
                        <span className="font-mono text-[10px]">{r.count}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      aria-label="Add reaction"
                      className="ml-1 grid min-h-7 min-w-7 place-items-center rounded-full font-mono text-[11px] pointer-coarse:min-h-9 pointer-coarse:min-w-9 text-muted-foreground/70 uppercase tracking-[0.2em] transition-colors hover:text-foreground"
                    >
                      +
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          <footer className="border-border/60 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="rounded-lg border border-border/60 bg-background/40 p-2">
              <textarea
                rows={2}
                aria-label="Reply"
                placeholder="Reply, or @mention someone…"
                className="w-full resize-none bg-transparent px-1 text-base outline-none sm:text-sm placeholder:text-muted-foreground"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.25em] pointer-coarse:invisible">
                  ⌘ + ↵ to send
                </span>
                <Button size="sm" type="button">
                  Reply
                </Button>
              </div>
            </div>
          </footer>
        </SheetPopup>
      </Sheet>
    </div>
  );
}

function FakeApp() {
  return (
    <div className="grid min-h-svh grid-cols-1 md:grid-cols-[220px_1fr]">
      <aside className="space-y-2 border-border/60 border-r bg-foreground/[0.02] p-4 max-md:hidden">
        <div className="h-3 w-28 rounded bg-foreground/15" />
        <div className="mt-3 h-2 w-32 rounded bg-foreground/10" />
        <div className="h-2 w-28 rounded bg-foreground/10" />
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          Issue · ENG-128
        </div>
        <h1 className="mt-1 font-heading text-2xl sm:text-3xl">
          Audit log query rewrite
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground text-sm">
          The conversation panel slides in from the right — full screen on
          phones.
        </p>
        <SheetTrigger
          render={<Button type="button" variant="outline" className="mt-4" />}
        >
          <MessageSquareIcon />
          Open conversation
        </SheetTrigger>
        <div className="mt-8 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-md border border-border/50 bg-foreground/[0.02]"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
