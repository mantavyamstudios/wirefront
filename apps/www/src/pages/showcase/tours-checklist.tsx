import { useEffect, useState } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CircleIcon,
  KeyIcon,
  LayersIcon,
  PaletteIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";
import { Button } from "@orbit/ui/button";

interface Task {
  id: string;
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  done: boolean;
}

const SEED: Task[] = [
  {
    id: "create-project",
    title: "Create your first project",
    description: "Bundle issues, docs, and people in one place.",
    Icon: LayersIcon,
    done: true,
  },
  {
    id: "invite",
    title: "Invite a teammate",
    description: "Share work — invites are good for 7 days.",
    Icon: UsersIcon,
    done: true,
  },
  {
    id: "theme",
    title: "Pick a theme",
    description: "Light, dark, or follow your system. Tweak the palette to taste.",
    Icon: PaletteIcon,
    done: false,
  },
  {
    id: "api-key",
    title: "Generate an API key",
    description: "Connect a script, CLI, or integration to your workspace.",
    Icon: KeyIcon,
    done: false,
  },
  {
    id: "first-deploy",
    title: "Ship something",
    description: "Trigger a deploy or close your first issue. Then it's real.",
    Icon: ZapIcon,
    done: false,
  },
];

export function ToursChecklistShowcasePage() {
  const [tasks, setTasks] = useState(SEED);
  const [open, setOpen] = useState(true);
  // Phones start with the checklist collapsed to a pill so it doesn't cover
  // the page; it opens as a bottom sheet. (Decided after mount — SSR-safe.)
  useEffect(() => {
    if (window.matchMedia("(max-width: 639px)").matches) setOpen(false);
  }, []);

  const done = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const pct = (done / total) * 100;

  const toggle = (id: string) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <FakeApp />

      <section
        aria-label="Setup checklist"
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[75svh] flex-col rounded-t-2xl border border-border/70 bg-background pb-[env(safe-area-inset-bottom)] shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-h-[calc(100svh-3rem)] sm:w-96 sm:rounded-xl sm:pb-0"
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls="setup-checklist"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full shrink-0 items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-foreground/[0.02]"
        >
          <div>
            <div className="font-medium text-sm">Get set up</div>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
              {done} of {total} complete
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative size-9">
              <svg aria-hidden viewBox="0 0 36 36" className="size-9 -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  className="stroke-foreground/10"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  className="stroke-foreground transition-[stroke-dashoffset]"
                  strokeWidth="3"
                  strokeDasharray={`${(pct / 100) * 88} 88`}
                  strokeLinecap="round"
                />
              </svg>
              <span aria-hidden className="absolute inset-0 flex items-center justify-center font-mono text-[10px]">
                {Math.round(pct)}%
              </span>
            </div>
            {open ? (
              <ChevronDownIcon aria-hidden className="size-4 opacity-60" />
            ) : (
              <ChevronUpIcon aria-hidden className="size-4 opacity-60" />
            )}
          </div>
        </button>

        {open ? (
          <ul id="setup-checklist" className="divide-y divide-border/50 overflow-y-auto overscroll-contain border-border/60 border-t">
            {tasks.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={t.done}
                  onClick={() => toggle(t.id)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-foreground/[0.02]"
                >
                  <span
                    aria-hidden
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                      t.done
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "border border-foreground/30 text-transparent"
                    }`}
                  >
                    {t.done ? (
                      <CheckIcon className="size-3.5" />
                    ) : (
                      <CircleIcon className="size-3" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`font-medium text-sm ${t.done ? "text-muted-foreground line-through" : ""}`}
                    >
                      {t.title}
                    </div>
                    <p className="mt-0.5 text-muted-foreground text-xs leading-snug">
                      {t.description}
                    </p>
                  </div>
                  <t.Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground/60" />
                </button>
              </li>
            ))}
            {done === total ? (
              <li className="bg-foreground/[0.02] px-4 py-3 text-center">
                <p className="text-sm">🎉 You're set. Great work.</p>
                <Button variant="ghost" size="sm" type="button" className="mt-1">
                  Hide for good
                </Button>
              </li>
            ) : null}
          </ul>
        ) : null}
      </section>
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
        <div className="h-2 w-30 rounded bg-foreground/10" />
      </aside>
      <main className="min-w-0 p-4 pb-32 sm:p-6 lg:p-10">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          Welcome
        </div>
        <h1 className="mt-1 font-heading text-2xl sm:text-3xl">First steps</h1>
        <p className="mt-2 max-w-md text-muted-foreground text-sm">
          Your onboarding checklist stays docked at the bottom of the screen. Tick it off as you
          explore.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-xl border border-border/50 bg-foreground/[0.02]"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
