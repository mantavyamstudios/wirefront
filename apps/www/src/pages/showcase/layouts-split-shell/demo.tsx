// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: the shell with a sample agent thread and work panel inside it.
// Not shipped by the registry; builders render their own thread and panel.

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  BookOpenIcon,
  BotIcon,
  CheckIcon,
  ChevronRightIcon,
  FileTextIcon,
  GlobeIcon,
  InboxIcon,
  LibraryIcon,
  LoaderCircleIcon,
  LockIcon,
  type LucideIcon,
  PaperclipIcon,
  PlusIcon,
  RotateCwIcon,
  SearchIcon,
  SquareTerminalIcon,
  WrenchIcon,
  XIcon,
} from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import { SplitShell } from "./view";
import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import { Checkbox } from "@wirefront/ui/checkbox";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@wirefront/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@wirefront/ui/tooltip";
import { cn } from "@wirefront/ui/lib/utils";

// shadcn's Badge has no status tones; render them as a secondary badge with
// Wirefront's semantic tokens.
const TONE_CLASS = {
  success: "bg-success/8 text-success-foreground dark:bg-success/16",
  warning: "bg-warning/8 text-warning-foreground dark:bg-warning/16",
  info: "bg-info/8 text-info-foreground dark:bg-info/16",
  error: "bg-destructive/8 text-destructive-foreground dark:bg-destructive/16",
} as const;
type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
const badgeVariant = (v: string): BadgeVariant => (v in TONE_CLASS ? "secondary" : (v as BadgeVariant));
const badgeTone = (v: string): string | undefined => TONE_CLASS[v as keyof typeof TONE_CLASS];

interface WorkspaceToolCall {
  id: string;
  tool: string;
  detail: string;
  icon: LucideIcon;
  ms: number;
  output?: string;
}

interface WorkspaceSource {
  id: string;
  title: string;
  domain: string;
  cited: number;
  tone: string;
}

const spring = { type: "spring", stiffness: 420, damping: 38 } as const;

const defaultToolCalls: WorkspaceToolCall[] = [
  { id: "c1", tool: "web.search", detail: "note taking app pricing 2026", icon: SearchIcon, ms: 820, output: "14 results · 6 kept" },
  { id: "c2", tool: "browser.open", detail: "quillpad.app/pricing", icon: GlobeIcon, ms: 1640, output: "Read 3 plan cards, 1 FAQ" },
  { id: "c3", tool: "browser.open", detail: "notably.io/plans", icon: GlobeIcon, ms: 1310, output: "Read 4 plan cards" },
  { id: "c4", tool: "files.read", detail: "churn-interviews.md", icon: FileTextIcon, ms: 410, output: "38 quotes tagged 'price'" },
  { id: "c5", tool: "python.run", detail: "compare_plans.py", icon: SquareTerminalIcon, ms: 2280, output: "Table: 3 apps × 5 columns" },
  { id: "c6", tool: "doc.write", detail: "Draft summary", icon: BookOpenIcon, ms: 1900, output: "412 words" },
];

const defaultSources: WorkspaceSource[] = [
  { id: "s1", title: "Quillpad · Plans and pricing", domain: "quillpad.app", cited: 4, tone: "bg-orange-500/14 text-orange-800 dark:text-orange-400" },
  { id: "s2", title: "Notably plans for teams", domain: "notably.io", cited: 3, tone: "bg-teal-500/14 text-teal-800 dark:text-teal-400" },
  { id: "s3", title: "Driftnote changelog: October", domain: "driftnote.co", cited: 2, tone: "bg-info/14 text-info-foreground" },
  { id: "s4", title: "churn-interviews.md", domain: "Orbit files", cited: 5, tone: "bg-violet-500/18 text-violet-700 dark:text-violet-400" },
  { id: "s5", title: "The state of note apps, 2026", domain: "fieldnotes.blog", cited: 1, tone: "bg-rose-500/14 text-rose-700 dark:text-rose-400" },
];

const compare = [
  { app: "Quillpad", price: "$8", seats: "Unlimited", ai: "Add-on $5", offline: true },
  { app: "Notably", price: "$10", seats: "Up to 50", ai: "Included", offline: false },
  { app: "Driftnote", price: "$6", seats: "Up to 20", ai: "None", offline: true },
];

const quotes = [
  { text: "We paid for Notably's AI on every seat and maybe three people used it.", who: "Ops lead, 30-person agency" },
  { text: "Half our week is on client sites with bad wifi. Offline was the deal breaker.", who: "Producer, events studio" },
];

const enter = { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.22, ease: [0.23, 1, 0.32, 1] } } as const;

function Cite({ n, label }: { n: number; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            aria-label={`Source ${n}: ${label}`}
            className="relative ms-0.5 inline-flex size-4 -translate-y-px cursor-pointer items-center justify-center rounded bg-muted align-middle font-medium text-[10px] text-muted-foreground tabular-nums outline-none before:absolute before:-inset-2 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            type="button"
          />
        }
      >
        {n}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function SkeletonLines({ rows, label }: { rows: number; label: string }) {
  return (
    <div aria-label={label} className="flex flex-col gap-2 rounded-xl border border-dashed p-3" role="status">
      <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
        <LoaderCircleIcon className="size-3 animate-spin motion-reduce:animate-none" />
        {label}
      </span>
      {[92, 75, 58, 41, 24].slice(0, rows).map((width) => (
        <span className="h-2 animate-pulse rounded-full bg-muted motion-reduce:animate-none" key={width} style={{ width: `${width}%` }} />
      ))}
    </div>
  );
}

function SampleThread({ running, step, total }: { running: boolean; step: number; total: number }) {
  const [draft, setDraft] = useState("");
  const composer = useId();
  const scroller = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const haveTable = step >= 3;
  useEffect(() => {
    const el = scroller.current;
    if (!el || step === 0) return;
    const t = setTimeout(() => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 240;
      if (nearBottom) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
    }, 60);
    return () => clearTimeout(t);
  }, [step, reduce]);
  const haveQuotes = step >= 4;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto" ref={scroller}>
        <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 @3xl:px-6">
          <div className="ms-auto max-w-[85%] text-pretty rounded-2xl rounded-br-md bg-muted px-4 py-2.5">
            Scan the three note apps we lose deals to. Pricing, seat limits, AI and offline. Use the churn interviews for
            why people leave.
          </div>
          <div className="flex gap-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
              <BotIcon className="size-3.5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <div className="flex h-5 items-center gap-2 text-muted-foreground text-xs">
                {running ? (
                  <LoaderCircleIcon className="size-3.5 animate-spin text-info motion-reduce:animate-none" />
                ) : (
                  <CheckIcon className="size-3.5 text-success" />
                )}
                <span className="tabular-nums">
                  {running ? `Working · step ${Math.min(step + 1, total)} of ${total}` : `Finished · ${total} steps · 9.4s`}
                </span>
              </div>
              <p className="text-pretty leading-relaxed">
                Notably costs the most per seat but bundles{" "}
                <span className="whitespace-nowrap">
                  AI
                  <Cite label="notably.io/plans" n={2} />,
                </span>{" "}
                and paying for AI nobody used is the top reason teams left. Quillpad is the closest match on seats and still
                works{" "}
                <span className="whitespace-nowrap">
                  offline
                  <Cite label="quillpad.app/pricing" n={1} />.
                </span>
              </p>

              {haveTable ? (
                <motion.div {...enter}>
                  <div className="hidden overflow-hidden rounded-xl border @3xl:block">
                    <table className="w-full text-left">
                      <thead className="bg-muted/60 text-muted-foreground text-xs">
                        <tr>
                          <th className="px-3 py-2 font-medium">App</th>
                          <th className="px-3 py-2 text-right font-medium">Per seat</th>
                          <th className="px-3 py-2 font-medium">Seats</th>
                          <th className="px-3 py-2 font-medium">AI</th>
                          <th className="px-3 py-2 text-center font-medium">Offline</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compare.map((r) => (
                          <tr className="border-t" key={r.app}>
                            <td className="px-3 py-2 font-medium">{r.app}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{r.price}</td>
                            <td className="px-3 py-2 text-muted-foreground">{r.seats}</td>
                            <td className="px-3 py-2 text-muted-foreground">{r.ai}</td>
                            <td className="px-3 py-2">
                              {r.offline ? (
                                <CheckIcon aria-label="Yes" className="mx-auto size-4 text-success" />
                              ) : (
                                <span className="block text-center text-muted-foreground"><span aria-hidden>—</span><span className="sr-only">No</span></span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ul className="flex flex-col divide-y rounded-xl border @3xl:hidden">
                    {compare.map((r) => (
                      <li className="flex flex-col gap-0.5 px-3 py-2.5" key={r.app}>
                        <span className="flex items-baseline justify-between">
                          <span className="font-medium">{r.app}</span>
                          <span className="tabular-nums">
                            {r.price}
                            <span className="text-muted-foreground text-xs"> / seat</span>
                          </span>
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {r.seats} seats · AI {r.ai.toLowerCase()} · {r.offline ? "works offline" : "online only"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ) : (
                <SkeletonLines label="Comparing plans" rows={3} />
              )}

              <div className="flex flex-col gap-2">
                <h3 className="font-medium text-xs">Why teams left</h3>
                {haveQuotes ? (
                  <motion.ul className="flex flex-col gap-2" {...enter}>
                    {quotes.map((q) => (
                      <li className="flex gap-3 rounded-xl bg-muted/60 px-3 py-2.5" key={q.who}>
                        <span aria-hidden className="w-0.5 shrink-0 rounded-full bg-violet-500/48" />
                        <span className="flex min-w-0 flex-col gap-1">
                          <span className="text-pretty leading-relaxed">“{q.text}”</span>
                          <span className="text-muted-foreground text-xs">
                            {q.who}{" "}
                            <Cite label="churn-interviews.md" n={4} />
                          </span>
                        </span>
                      </li>
                    ))}
                  </motion.ul>
                ) : (
                  <SkeletonLines label="Reading churn-interviews.md" rows={2} />
                )}
              </div>

              <AnimatePresence initial={false}>
                {!running && (
                  <motion.div className="flex flex-col gap-3" {...enter} exit={{ opacity: 0 }}>
                    <p className="text-pretty leading-relaxed">
                      I saved the write-up to Research. Want a one-slide version for Thursday&apos;s pricing review?
                    </p>
                    <div className="flex max-w-sm items-center gap-3 rounded-xl border bg-card p-2.5 shadow-xs/5">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-info/12 text-info-foreground">
                        <FileTextIcon className="size-4" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col leading-tight">
                        <span className="truncate font-medium">Note apps: competitive scan</span>
                        <span className="text-muted-foreground text-xs tabular-nums">Doc · 412 words · 5 sources</span>
                      </span>
                      <Button size="sm" variant="outline">
                        Open
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 pb-4 @3xl:px-6">
        <form
          className="mx-auto flex max-w-2xl items-end gap-2 rounded-2xl border bg-card p-2 shadow-xs/5 transition-shadow focus-within:border-ring/64 focus-within:ring-[3px] focus-within:ring-ring/16"
          onSubmit={(e) => {
            e.preventDefault();
            setDraft("");
          }}
        >
          <Button aria-label="Attach" size="icon-sm" type="button" variant="ghost">
            <PaperclipIcon />
          </Button>
          <label className="sr-only" htmlFor={composer}>
            Message
          </label>
          <textarea
            className="field-sizing-content max-h-32 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground/72"
            id={composer}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={running ? "Steer the task while it works…" : "Ask a follow-up…"}
            rows={1}
            value={draft}
          />
          <Button
            aria-label="Send"
            className="rounded-full transition-transform active:scale-[0.97]"
            disabled={!draft.trim()}
            size="icon-sm"
            type="submit"
          >
            <ArrowUpIcon />
          </Button>
        </form>
      </div>
    </div>
  );
}

function ToolsTab({ calls, step }: { calls: WorkspaceToolCall[]; step: number }) {
  const [open, setOpen] = useState<string | null>(null);
  const done = Math.min(step, calls.length);
  const elapsed = calls.slice(0, done).reduce((sum, c) => sum + c.ms, 0);
  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">
              {done === calls.length ? "All steps done" : `Step ${done + 1} of ${calls.length}`}
            </span>
            <span className="text-muted-foreground tabular-nums">{(elapsed / 1000).toFixed(1)}s tool time</span>
          </div>
          <div className="flex gap-1">
            {calls.map((c, i) => (
              <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-muted" key={c.id}>
                <motion.span
                  animate={{ scaleX: i < done ? 1 : i === done ? 0.85 : 0 }}
                  className={cn("absolute inset-0 origin-left rounded-full", i < done ? "bg-foreground/72" : "bg-info")}
                  initial={false}
                  key={i < done ? "done" : i === done ? "run" : "queued"}
                  transition={
                    i === done ? { duration: (c.ms + 1400) / 1000, ease: [0.23, 1, 0.32, 1] } : { duration: 0.2, ease: "easeOut" }
                  }
                />
              </span>
            ))}
          </div>
        </div>
      </div>
      <ol className="relative flex flex-col">
        <span aria-hidden className="absolute top-5 bottom-5 left-[19px] w-px bg-border" />
        {calls.map((c, i) => {
          const state = i < done ? "done" : i === done ? "running" : "queued";
          const expanded = open === c.id && state === "done";
          return (
            <li className="relative" key={c.id}>
              <button
                aria-expanded={state === "done" ? expanded : undefined}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  state === "done" ? "cursor-pointer hover:bg-accent" : "cursor-default",
                )}
                disabled={state !== "done"}
                onClick={() => setOpen(expanded ? null : c.id)}
                type="button"
              >
                <span
                  className={cn(
                    "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border bg-background transition-colors",
                    state === "running" && "border-info/48 text-info",
                    state === "queued" && "border-dashed text-muted-foreground/48",
                  )}
                >
                  {state === "running" ? (
                    <LoaderCircleIcon className="size-3.5 animate-spin motion-reduce:animate-none" />
                  ) : (
                    <c.icon className={cn("size-3.5", state === "done" && "text-muted-foreground")} />
                  )}
                </span>
                <span className={cn("flex min-w-0 flex-1 flex-col gap-0.5 transition-opacity", state === "queued" && "opacity-48")}>
                  <span className="flex items-center gap-2">
                    <span className="font-medium font-mono text-xs">{c.tool}</span>
                    <span className="ms-auto text-muted-foreground text-xs tabular-nums">
                      {state === "running" ? (
                        <span className="text-info-foreground">running</span>
                      ) : state === "done" ? (
                        `${(c.ms / 1000).toFixed(1)}s`
                      ) : (
                        "queued"
                      )}
                    </span>
                  </span>
                  <span className="truncate text-muted-foreground text-xs">{c.detail}</span>
                </span>
                <ChevronRightIcon
                  className={cn(
                    "mt-1 size-3.5 shrink-0 text-muted-foreground transition-[rotate,opacity]",
                    expanded && "rotate-90",
                    state !== "done" && "opacity-0",
                  )}
                />
              </button>
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    animate={{ height: "auto", opacity: 1 }}
                    className="overflow-hidden"
                    exit={{ height: 0, opacity: 0 }}
                    initial={{ height: 0, opacity: 0 }}
                    transition={spring}
                  >
                    <div className="mb-2 ms-11 me-2 rounded-lg bg-muted px-3 py-2 font-mono text-muted-foreground text-xs">
                      → {c.output ?? "ok"}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function BrowserTab({ reading }: { reading: boolean }) {
  const reduce = useReducedMotion();
  const plans = [
    { name: "Personal", price: "$0", note: "1 seat" },
    { name: "Team", price: "$8", note: "per seat / mo" },
    { name: "Business", price: "$14", note: "per seat / mo" },
  ];
  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex items-center gap-1 pb-2">
        <Button aria-label="Back" size="icon-xs" variant="ghost">
          <ArrowLeftIcon />
        </Button>
        <Button aria-label="Forward" disabled size="icon-xs" variant="ghost">
          <ArrowRightIcon />
        </Button>
        <Button aria-label="Reload" size="icon-xs" variant="ghost">
          <RotateCwIcon />
        </Button>
        <div className="ms-1 flex h-7 min-w-0 flex-1 items-center gap-1.5 rounded-full bg-muted px-3 text-xs">
          <LockIcon className="size-3 shrink-0 text-muted-foreground" />
          <span className="truncate">
            quillpad.app<span className="text-muted-foreground">/pricing</span>
          </span>
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-y-auto rounded-xl border bg-background [scrollbar-width:thin]">
        <div className="flex items-center gap-2 border-b px-4 py-2.5">
          <span className="size-3.5 rounded bg-orange-500" />
          <span className="font-semibold text-xs">Quillpad</span>
          <span className="ms-auto flex gap-3 text-[10px] text-muted-foreground">
            <span>Product</span>
            <span className="text-foreground">Pricing</span>
            <span>Blog</span>
          </span>
        </div>
        <div className="px-4 pt-5 pb-4 text-center">
          <div className="font-heading font-semibold text-base">Simple plans for every notebook</div>
          <div className="mt-1 text-[11px] text-muted-foreground">Billed yearly. Cancel any time.</div>
        </div>
        <div className="relative mx-4 grid grid-cols-3 gap-2">
          {plans.map((p, i) => (
            <div className={cn("rounded-lg border p-2.5", i === 1 && "border-orange-500/40 bg-orange-500/5")} key={p.name}>
              <div className="font-medium text-[11px]">{p.name}</div>
              <div className="mt-1 font-semibold text-base tabular-nums">{p.price}</div>
              <div className="text-[10px] text-muted-foreground">{p.note}</div>
              <div className="mt-2 flex flex-col gap-1">
                {[0, 1, 2].map((k) => (
                  <span className="h-1 rounded-full bg-muted" key={k} style={{ width: `${86 - k * 18}%` }} />
                ))}
              </div>
            </div>
          ))}
          {reading && (
            <motion.span
              animate={reduce ? undefined : { opacity: [0.5, 1, 0.5] }}
              className="pointer-events-none absolute -inset-1.5 rounded-xl border-2 border-info"
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="absolute -top-2.5 left-2 rounded-full bg-info px-2 py-0.5 font-medium text-[10px] text-white">
                Reading plan table
              </span>
            </motion.span>
          )}
        </div>
        <div className="mx-4 mt-5 rounded-lg border">
          {[
            ["Offline notebooks", true, true, true],
            ["Shared spaces", false, true, true],
            ["AI writing", false, "Add-on", "Add-on"],
            ["SSO & audit log", false, false, true],
          ].map(([label, ...cells], r) => (
            <div className={cn("grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center px-2.5 py-1.5 text-[10px]", r > 0 && "border-t")} key={String(label)}>
              <span className="text-muted-foreground">{label}</span>
              {cells.map((c, k) => (
                <span className="text-center" key={["a", "b", "c"][k]}>
                  {c === true ? (
                    <CheckIcon className="mx-auto size-3 text-success" />
                  ) : c === false ? (
                    <span className="text-muted-foreground/60">—</span>
                  ) : (
                    c
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
        <div className="mx-4 mt-5 mb-4 flex flex-col gap-2">
          <div className="font-medium text-[11px]">Questions</div>
          {["Can I switch plans later?", "Do you offer student pricing?", "What happens to my notes if I cancel?"].map((q) => (
            <div className="flex items-center justify-between rounded-md bg-muted/60 px-2.5 py-1.5 text-[10px]" key={q}>
              {q}
              <PlusIcon className="size-3 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SourcesTab({ sources }: { sources: WorkspaceSource[] }) {
  const [included, setIncluded] = useState(() => sources.map((s) => s.id));
  return (
    <div className="flex flex-col gap-1 p-3">
      <p className="px-2 pb-1 text-muted-foreground text-xs">
        <span className="tabular-nums">{included.length}</span> of {sources.length} used in the answer
      </p>
      {sources.map((s, i) => {
        const on = included.includes(s.id);
        const id = `src-${s.id}`;
        return (
          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-opacity hover:bg-accent",
              !on && "opacity-56",
            )}
            htmlFor={id}
            key={s.id}
          >
            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md font-semibold text-xs tabular-nums", s.tone)}>
              {i + 1}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">{s.title}</span>
              <span className="truncate text-muted-foreground text-xs">
                {s.domain} · cited {s.cited}×
              </span>
            </span>
            <Checkbox
              checked={on}
              id={id}
              onCheckedChange={(v) => setIncluded((x) => (v ? [...x, s.id] : x.filter((y) => y !== s.id)))}
            />
          </label>
        );
      })}
      <button
        className="mt-1 flex h-10 cursor-pointer items-center gap-3 rounded-lg border border-dashed px-2 text-muted-foreground outline-none transition-transform hover:border-foreground/24 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
        type="button"
      >
        <span className="flex size-7 items-center justify-center">
          <PlusIcon className="size-4" />
        </span>
        Add a link or file
      </button>
    </div>
  );
}

function WorkPanel({
  calls,
  sources,
  step,
  onClose,
}: {
  calls: WorkspaceToolCall[];
  sources: WorkspaceSource[];
  step: number;
  onClose: () => void;
}) {
  const running = step < calls.length;
  const reading = running && calls[step]?.tool.startsWith("browser");
  const [tab, setTab] = useState("tools");
  return (
    <Tabs className="h-full min-h-0 gap-0" onValueChange={(v) => setTab(v as string)} value={tab}>
      <div className="flex h-13 shrink-0 items-center gap-2 border-b px-3">
        <TabsList className="h-7 min-w-0 overflow-x-auto text-muted-foreground [scrollbar-width:none]">
          <TabsTrigger className="text-foreground/70" value="tools">
            <WrenchIcon />
            Tools
            <span className="text-muted-foreground text-xs tabular-nums">{calls.length}</span>
          </TabsTrigger>
          <TabsTrigger className="text-foreground/70" value="browser">
            <GlobeIcon />
            Browser
            {reading && <span className="size-1.5 rounded-full bg-info" />}
          </TabsTrigger>
          <TabsTrigger className="text-foreground/70" value="sources">
            <BookOpenIcon />
            Sources
          </TabsTrigger>
        </TabsList>
        <Button aria-label="Close work panel" className="ms-auto" onClick={onClose} size="icon-sm" variant="ghost">
          <XIcon />
        </Button>
      </div>
      <TabsContent className="min-h-0 overflow-y-auto" value="tools">
        <ToolsTab calls={calls} step={step} />
      </TabsContent>
      <TabsContent className="min-h-0" value="browser">
        <BrowserTab reading={Boolean(reading)} />
      </TabsContent>
      <TabsContent className="min-h-0 overflow-y-auto" value="sources">
        <SourcesTab sources={sources} />
      </TabsContent>
    </Tabs>
  );
}

const demoNow = () => new Date(fixtures.now);

export function LayoutsSplitShellShowcasePage() {
  const [step, setStep] = useState(3);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (step >= defaultToolCalls.length) return;
    const timer = setTimeout(() => setStep((s) => s + 1), reduce ? 400 : (defaultToolCalls[step]?.ms ?? 1500) + 1400);
    return () => clearTimeout(timer);
  }, [step, reduce]);

  const running = step < defaultToolCalls.length;
  const items = fixtures.listTasks.map((task) => (task.id === "t1" ? { ...task, state: running ? ("running" as const) : ("done" as const) } : task));

  return (
    <WirefrontProvider now={demoNow}>
      <DevlFrame>
        <SplitShell
          actions={
            <>
              <Badge className={cn(badgeTone(running ? "info" : "success"), "hidden gap-1.5 @lg:inline-flex")} variant={badgeVariant(running ? "info" : "success")}>
                {running ? <LoaderCircleIcon className="size-3 animate-spin motion-reduce:animate-none" /> : <CheckIcon className="size-3" />}
                {running ? "Running" : "Done"}
              </Badge>
              {!running && (
                <Button className="hidden @2xl:inline-flex" onClick={() => setStep(0)} size="sm" variant="ghost">
                  <RotateCwIcon />
                  Re-run
                </Button>
              )}
            </>
          }
          activeId="t1"
          brand={{ name: "Orbit", subtitle: "Workspace" }}
          breadcrumbs={[{ label: "Research" }, { label: "Competitive scan: note apps" }]}
          items={items}
          nav={[
            { id: "inbox", label: "Inbox", href: "#inbox", icon: <InboxIcon />, count: 2 },
            { id: "library", label: "Library", href: "#library", icon: <LibraryIcon /> },
          ]}
          newHref="#new"
          onSearch={() => {}}
          panel={({ close }) => <WorkPanel calls={defaultToolCalls} onClose={close} sources={defaultSources} step={step} />}
          user={fixtures.user}
        >
          <SampleThread running={running} step={step} total={defaultToolCalls.length} />
        </SplitShell>
      </DevlFrame>
    </WirefrontProvider>
  );
}
