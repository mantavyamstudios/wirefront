import { useState } from "react";
import { MoreHorizontalIcon, SmileIcon } from "lucide-react";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@orbit/ui/menu";

interface Comment {
  initials: string;
  tone: string;
  name: string;
  time: string;
  body: React.ReactNode;
  reactions: { emoji: string; count: number; mine?: boolean }[];
  replyCount: number;
  edited?: boolean;
}

const COMMENTS: Comment[] = [
  {
    initials: "MO",
    tone: "bg-emerald-500/85 text-white",
    name: "Maya Okafor",
    time: "2h ago",
    body: (
      <>
        Pushed the new audit log query. The aggregate over the last 30 days
        comes back in <code>~120ms</code> on the prod replica — I think we can
        ship.
      </>
    ),
    reactions: [
      { emoji: "🚀", count: 4, mine: true },
      { emoji: "👀", count: 2 },
      { emoji: "💯", count: 1 },
    ],
    replyCount: 3,
  },
  {
    initials: "JL",
    tone: "bg-amber-500/85 text-white",
    name: "James Lin",
    time: "1h ago",
    body: (
      <>
        Nice. Can you also paste the query plan? Want to make sure it's still
        using the <code>(workspace_id, created_at)</code> index.
      </>
    ),
    reactions: [{ emoji: "👍", count: 1, mine: true }],
    replyCount: 1,
    edited: true,
  },
  {
    initials: "RP",
    tone: "bg-violet-500/85 text-white",
    name: "Riya Patel",
    time: "47m ago",
    body: (
      <>
        Tagging <Mention>@sean</Mention> — heads up, this rolls in tonight if we
        get a thumbs up from review.
      </>
    ),
    reactions: [],
    replyCount: 0,
  },
];

export function ThreadsCommentRowShowcasePage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-16">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          Comment patterns
        </div>
        <h1 className="mt-1 font-heading text-2xl sm:text-3xl">
          Single comment row
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          The atomic unit — same shape used inline, in side panels, and in
          activity feeds.
        </p>

        <ul className="mt-8 flex flex-col gap-4 sm:mt-10 sm:gap-6">
          {COMMENTS.map((c, i) => (
            <CommentRow key={i} c={c} />
          ))}
        </ul>
      </div>
    </div>
  );
}

// The ⋯ menu is revealed on hover for mouse users, but is always visible on
// touch screens and whenever focus is inside the row. Reactions toggle.
function CommentRow({ c }: { c: (typeof COMMENTS)[number] }) {
  const [reactions, setReactions] = useState(c.reactions);
  const toggle = (j: number) =>
    setReactions((rs) =>
      rs.map((r, k) =>
        k === j
          ? { ...r, mine: !r.mine, count: r.count + (r.mine ? -1 : 1) }
          : r,
      ),
    );
  return (
    <li className="group rounded-lg border border-border/60 bg-background/40 p-3 transition-colors hover:border-border sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div
            aria-hidden
            className={`flex size-8 shrink-0 items-center justify-center rounded-full font-medium text-[12px] ${c.tone}`}
          >
            {c.initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{c.name}</span>
              {c.edited ? (
                <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em]">
                  edited
                </span>
              ) : null}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.2em]">
              {c.time}
            </div>
          </div>
        </div>
        <Menu>
          <MenuTrigger
            aria-label={`More actions for ${c.name}'s comment`}
            className="-mr-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-foreground/[0.05] hover:text-foreground focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 data-popup-open:opacity-100 pointer-coarse:size-10 pointer-coarse:opacity-100"
          >
            <MoreHorizontalIcon className="size-4" />
          </MenuTrigger>
          <MenuPopup align="end">
            <MenuItem>Copy link</MenuItem>
            <MenuItem>Edit</MenuItem>
            <MenuItem variant="destructive">Delete</MenuItem>
          </MenuPopup>
        </Menu>
      </div>

      <p className="mt-2.5 text-foreground/90 text-sm leading-relaxed [&_code]:rounded [&_code]:bg-foreground/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px]">
        {c.body}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {reactions.map((r, j) => (
          <button
            key={j}
            type="button"
            aria-pressed={!!r.mine}
            aria-label={`${r.emoji} ${r.count} reaction${r.count === 1 ? "" : "s"}`}
            onClick={() => toggle(j)}
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
          className="inline-flex size-7 items-center justify-center rounded-full border border-border/60 bg-background/40 text-muted-foreground pointer-coarse:size-9 transition-colors hover:border-border hover:text-foreground"
        >
          <SmileIcon className="size-3" />
        </button>
        <span className="ml-auto inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground/80 uppercase tracking-[0.15em]">
          {c.replyCount > 0 ? (
            <button
              type="button"
              className="min-h-8 rounded px-1.5 transition-colors hover:text-foreground pointer-coarse:min-h-10"
            >
              {c.replyCount} {c.replyCount === 1 ? "reply" : "replies"}
            </button>
          ) : null}
          <button
            type="button"
            className="min-h-8 rounded px-1.5 transition-colors hover:text-foreground pointer-coarse:min-h-10"
          >
            Reply
          </button>
        </span>
      </div>
    </li>
  );
}

function Mention({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-primary/15 px-1.5 py-0.5 font-medium text-primary text-xs">
      {children}
    </span>
  );
}
