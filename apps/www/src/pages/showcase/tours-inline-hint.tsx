import { useState } from "react";
import { LightbulbIcon, XIcon } from "lucide-react";
import { Button } from "@orbit/ui/button";

export function ToursInlineHintShowcasePage() {
  const [open, setOpen] = useState(true);

  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <FakeApp onShow={open ? undefined : () => setOpen(true)} />

      {/* Phones: full width above the home indicator. sm+: a 20rem card
          bottom-right. Non-blocking, so it's a labelled region, not a dialog. */}
      {open ? (
        <aside
          aria-label="Tip"
          className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-80"
        >
          <div className="rounded-xl border border-border/70 bg-background p-4 shadow-xl backdrop-blur">
            <div className="flex items-start gap-3">
              <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <LightbulbIcon className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm">
                  Group projects by team
                </div>
                <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
                  You have 6 projects now — try grouping the sidebar by team to
                  keep the noise down.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" variant="outline" type="button">
                    Try it
                  </Button>
                  <Button size="sm" variant="ghost" type="button" onClick={() => setOpen(false)}>
                    Not now
                  </Button>
                </div>
              </div>
              <button
                type="button"
                aria-label="Dismiss tip"
                onClick={() => setOpen(false)}
                className="-mt-1.5 -mr-1.5 grid size-8 shrink-0 place-items-center rounded-md pointer-coarse:size-10 text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between border-border/60 border-t pt-1 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              <span>Tip · 1 of 8</span>
              <button
                type="button"
                className="-mr-2 min-h-8 rounded px-2 transition-colors hover:text-foreground pointer-coarse:min-h-10"
              >
                See all tips →
              </button>
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  );
}

function FakeApp({ onShow }: { onShow?: () => void }) {
  return (
    <div className="grid min-h-svh grid-cols-1 md:grid-cols-[220px_1fr]">
      <aside className="space-y-2 border-border/60 border-r bg-foreground/[0.02] p-4 max-md:hidden">
        <div className="h-3 w-28 rounded bg-foreground/15" />
        <div className="mt-3 h-2 w-32 rounded bg-foreground/10" />
        <div className="h-2 w-28 rounded bg-foreground/10" />
        <div className="h-2 w-30 rounded bg-foreground/10" />
        <div className="h-2 w-26 rounded bg-foreground/10" />
        <div className="h-2 w-24 rounded bg-foreground/10" />
      </aside>
      <main className="min-w-0 p-4 pb-64 sm:p-6 sm:pb-64 lg:p-10">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          Projects
        </div>
        <h1 className="mt-1 font-heading text-2xl sm:text-3xl">All projects</h1>
        {onShow ? (
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onShow}>
            Show tip
          </Button>
        ) : null}
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-border/50 bg-foreground/[0.02] p-3"
            >
              <div className="h-2 w-20 rounded bg-foreground/20" />
              <div className="mt-2 h-2 w-24 rounded bg-foreground/10" />
              <div className="mt-2 h-2 w-16 rounded bg-foreground/10" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
