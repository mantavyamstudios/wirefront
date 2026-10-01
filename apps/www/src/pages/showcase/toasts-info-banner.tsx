import { useState } from "react";
import { InfoIcon, XIcon } from "lucide-react";
import { Button } from "@orbit/ui/button";

// A system banner is persistent, page-level and dismissible — not a toast.
// The message wraps instead of truncating (it's the whole point), and on
// phones "Learn more" drops under the text.
export function ToastsInfoBannerShowcasePage() {
  const [visible, setVisible] = useState(true);

  return (
    <div className="relative flex min-h-svh flex-col bg-background text-foreground">
      {visible ? (
        <div
          role="region"
          aria-label="System announcement"
          className="sticky top-0 z-50 border-amber-500/40 border-b bg-amber-500/10 pt-[env(safe-area-inset-top)] backdrop-blur dark:bg-amber-500/[0.08]"
        >
          <div className="mx-auto flex max-w-6xl items-start gap-3 py-2 pr-2 pl-4 sm:items-center sm:pr-4 sm:pl-6">
            <InfoIcon
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-amber-700 sm:mt-0 dark:text-amber-400"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <p className="min-w-0 flex-1 text-amber-900 text-sm dark:text-amber-100">
                <span className="font-medium">Scheduled maintenance</span>{" "}
                <span className="text-amber-800/80 dark:text-amber-200/80">
                  · Tue Apr 29 from 2:00–2:30 UTC. Brief downtime expected.
                </span>
              </p>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                className="-ml-2.5 self-start text-amber-900 hover:bg-amber-500/15 sm:ml-0 sm:self-auto dark:text-amber-100"
              >
                Learn more
              </Button>
            </div>
            <button
              type="button"
              aria-label="Dismiss announcement"
              onClick={() => setVisible(false)}
              className="grid size-8 shrink-0 place-items-center rounded-md text-amber-900/70 transition-colors hover:bg-amber-500/10 hover:text-amber-900 pointer-coarse:size-10 dark:text-amber-100/70 dark:hover:text-amber-100"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </div>
      ) : null}

      <FakeAppBody />
    </div>
  );
}

function FakeAppBody() {
  return (
    // flex-1 instead of a hard-coded calc(100svh - 44px): the banner's height
    // varies once it can wrap.
    <div className="grid flex-1 grid-cols-1 md:grid-cols-[220px_1fr]">
      <aside className="border-border/60 border-r bg-foreground/[0.02] p-4 max-md:hidden">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          Workspace
        </div>
        <div className="mt-1 font-medium text-sm">Acme inc.</div>
        <ul className="mt-6 space-y-1.5 text-muted-foreground text-sm">
          <li className="text-foreground">● Home</li>
          <li>○ Inbox</li>
          <li>○ Projects</li>
          <li>○ People</li>
        </ul>
      </aside>
      <main className="p-4 sm:p-6 lg:p-10">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          Overview
        </div>
        <h1 className="mt-1 font-heading text-2xl sm:text-3xl">Welcome back, Sean</h1>
        <p className="mt-2 max-w-md text-muted-foreground text-sm">
          A typical landing pane sits underneath. The banner is sticky and
          adapts to the scroll position.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="h-24 rounded-xl border border-border/60 bg-background/40" />
          <div className="h-24 rounded-xl border border-border/60 bg-background/40" />
          <div className="h-24 rounded-xl border border-border/60 bg-background/40" />
        </div>
      </main>
    </div>
  );
}
