import { useEffect, useState } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  FileTextIcon,
  ImageIcon,
  XIcon,
} from "lucide-react";

interface Job {
  id: number;
  name: string;
  size: string;
  kind: "image" | "doc";
  progress: number;
}

const INITIAL: Job[] = [
  { id: 1, name: "preview-render-4k.png", size: "8.1 MB", kind: "image", progress: 28 },
  { id: 2, name: "Q3-roadmap.pdf", size: "684 KB", kind: "doc", progress: 62 },
];

// A persistent upload dock rather than a transient toast: it lives until the
// uploads finish or the user closes it. Phones: full-width above the home
// indicator. sm+: a 24rem panel bottom-right. Collapsible on both.
export function ToastsProgressShowcasePage() {
  const [jobs, setJobs] = useState<Job[]>(INITIAL);
  const [open, setOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const t = window.setInterval(() => {
      setJobs((js) =>
        js.map((j) => ({
          ...j,
          progress: Math.min(100, j.progress + Math.random() * 4),
        })),
      );
    }, 600);
    return () => window.clearInterval(t);
  }, []);

  const total = jobs.length;
  const done = jobs.filter((j) => j.progress >= 100).length;
  const finished = total > 0 && done === total;

  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <FakeAppBackdrop />
      {open && total > 0 ? (
        <section
          aria-label="Uploads"
          className="fixed inset-x-0 bottom-0 z-50 border-border/70 border-t bg-background pb-[env(safe-area-inset-bottom)] shadow-lg sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96 sm:rounded-xl sm:border sm:pb-0"
        >
          <div className="flex items-center justify-between gap-2 border-border/60 border-b py-1.5 pr-1.5 pl-3.5">
            <div className="flex min-w-0 items-center gap-2">
              {finished ? (
                <CheckIcon aria-hidden className="size-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <span aria-hidden className="size-2 rounded-full bg-primary motion-safe:animate-pulse" />
              )}
              {/* Announced when the count changes, not on every progress tick. */}
              <span aria-live="polite" className="font-medium text-sm">
                {finished ? "Uploads complete" : `Uploading ${done} of ${total}`}
              </span>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                aria-expanded={!collapsed}
                aria-label={collapsed ? "Expand uploads" : "Collapse uploads"}
                onClick={() => setCollapsed((c) => !c)}
                className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground pointer-coarse:size-10"
              >
                <ChevronDownIcon
                  className={"size-4 transition-transform " + (collapsed ? "rotate-180" : "")}
                />
              </button>
              <button
                type="button"
                aria-label="Close uploads"
                onClick={() => setOpen(false)}
                className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground pointer-coarse:size-10"
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
          </div>
          {!collapsed ? (
            <ul className="max-h-[50svh] divide-y divide-border/40 overflow-y-auto">
              {jobs.map((j) => {
                const pct = Math.round(j.progress);
                return (
                  <li key={j.id} className="flex items-center gap-3 px-3.5 py-2.5">
                    <span
                      aria-hidden
                      className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground/[0.05]"
                    >
                      {j.kind === "image" ? (
                        <ImageIcon className="size-3.5 opacity-70" />
                      ) : (
                        <FileTextIcon className="size-3.5 opacity-70" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium text-sm">{j.name}</span>
                        <span className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
                          {pct}%
                        </span>
                      </div>
                      <div
                        role="progressbar"
                        aria-label={`Uploading ${j.name}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={pct}
                        className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/[0.06]"
                      >
                        <div
                          className="h-full rounded-full bg-foreground/70 transition-[width] motion-reduce:transition-none"
                          style={{ width: `${j.progress}%` }}
                        />
                      </div>
                      <div className="mt-0.5 flex items-center justify-between text-muted-foreground text-xs">
                        <span>{j.size}</span>
                        {j.progress < 100 ? (
                          <button
                            type="button"
                            aria-label={`Cancel ${j.name}`}
                            onClick={() => setJobs((js) => js.filter((x) => x.id !== j.id))}
                            className="-mr-2 min-h-8 rounded px-2 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors hover:text-foreground pointer-coarse:min-h-10"
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className="min-h-8 py-2 font-mono text-[11px] uppercase tracking-[0.15em]">
                            Done
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function FakeAppBackdrop() {
  return (
    <div aria-hidden className="space-y-3 p-4 opacity-50 sm:p-10">
      <div className="h-4 w-48 max-w-full rounded bg-foreground/15" />
      <div className="h-2 w-72 max-w-full rounded bg-foreground/10" />
      <div className="h-40 rounded-xl border border-border/40 bg-foreground/[0.02]" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-32 rounded-xl border border-border/40 bg-foreground/[0.02]"
          />
        ))}
      </div>
    </div>
  );
}
