import { useState } from "react";
import { CheckCircle2Icon, ChevronDownIcon } from "lucide-react";
import { Button } from "@orbit/ui/button";

interface Thread {
  id: number;
  initials: string;
  tone: string;
  name: string;
  time: string;
  preview: string;
  resolvedBy: { initials: string; tone: string; name: string };
  replyCount: number;
}

const THREADS: Thread[] = [
  {
    id: 1,
    initials: "MO",
    tone: "bg-emerald-500/85 text-white",
    name: "Maya Okafor",
    time: "yesterday",
    preview:
      "Should we keep this paragraph? It's nicely written but covers the same ground as the diagram below.",
    resolvedBy: {
      initials: "JL",
      tone: "bg-amber-500/85 text-white",
      name: "James",
    },
    replyCount: 3,
  },
  {
    id: 2,
    initials: "RP",
    tone: "bg-violet-500/85 text-white",
    name: "Riya Patel",
    time: "Mon",
    preview:
      "+1 from me. Also: can you tag the migration with audit-q3 so we can roll back cleanly if needed?",
    resolvedBy: {
      initials: "MO",
      tone: "bg-emerald-500/85 text-white",
      name: "Maya",
    },
    replyCount: 1,
  },
  {
    id: 3,
    initials: "DK",
    tone: "bg-sky-500/85 text-white",
    name: "Dani Kim",
    time: "Apr 21",
    preview:
      "Tightened the corner radius on the empty-state cards — I think it reads better now.",
    resolvedBy: {
      initials: "DK",
      tone: "bg-sky-500/85 text-white",
      name: "Dani",
    },
    replyCount: 0,
  },
];

export function ThreadsResolvedShowcasePage() {
  const [expanded, setExpanded] = useState<number[]>([]);
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
              Comments · Resolved
            </div>
            <h1 className="mt-1 font-heading text-2xl sm:text-3xl">
              Resolved threads
            </h1>
          </div>
          <div className="inline-flex items-center gap-1 self-start rounded-md border border-border/60 bg-background/40 p-0.5 font-mono text-[10px] uppercase tracking-[0.25em]">
            <button
              type="button"
              aria-pressed={false}
              className="min-h-8 rounded px-2.5 text-muted-foreground hover:text-foreground pointer-coarse:min-h-10"
            >
              Open · 4
            </button>
            <button
              type="button"
              aria-pressed
              className="min-h-8 rounded bg-foreground px-2.5 text-background pointer-coarse:min-h-10"
            >
              Resolved · {THREADS.length}
            </button>
          </div>
        </div>

        <ul className="mt-8 flex flex-col gap-3">
          {THREADS.map((t) => {
            const isOpen = expanded.includes(t.id);
            return (
              <li
                key={t.id}
                className="group overflow-hidden rounded-lg border border-border/60 bg-background/40 transition-colors hover:border-border"
              >
                <div className="flex items-start gap-3 px-3 py-3 sm:items-center sm:px-4">
                  <span
                    aria-hidden
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  >
                    <CheckCircle2Icon className="size-3.5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        aria-hidden
                        className={`flex size-5 shrink-0 items-center justify-center rounded-full font-medium text-[10px] ${t.tone}`}
                      >
                        {t.initials}
                      </div>
                      <span className="truncate font-medium text-sm">
                        {t.name}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.2em]">
                        {t.time}
                      </span>
                      {t.replyCount > 0 ? (
                        <span className="ml-1 rounded-full bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                          +{t.replyCount}
                        </span>
                      ) : null}
                    </div>
                    {/* Two lines collapsed (not a ~20-char truncate), full when expanded. */}
                    <p
                      id={`resolved-${t.id}`}
                      className={
                        "mt-1 text-muted-foreground text-sm " +
                        (isOpen ? "" : "line-clamp-2")
                      }
                    >
                      {t.preview}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                    <span className="hidden items-center gap-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] sm:flex">
                      by
                      <span
                        className={`flex size-4 items-center justify-center rounded-full font-medium text-[8px] ${t.resolvedBy.tone}`}
                      >
                        {t.resolvedBy.initials}
                      </span>
                      {t.resolvedBy.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      aria-label={`Reopen thread by ${t.name}`}
                    >
                      Reopen
                    </Button>
                    {/* Hover-revealed for mouse users; always shown on touch and when focused. */}
                    <button
                      type="button"
                      aria-label={isOpen ? "Collapse thread" : "Expand thread"}
                      aria-expanded={isOpen}
                      aria-controls={`resolved-${t.id}`}
                      onClick={() =>
                        setExpanded((x) =>
                          isOpen ? x.filter((id) => id !== t.id) : [...x, t.id],
                        )
                      }
                      className="grid size-8 place-items-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-foreground/[0.05] hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 aria-expanded:opacity-100 pointer-coarse:size-10 pointer-coarse:opacity-100"
                    >
                      <ChevronDownIcon
                        className={
                          "size-3.5 transition-transform " +
                          (isOpen ? "rotate-180" : "")
                        }
                      />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
