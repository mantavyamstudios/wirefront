// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `run-replay`).
"use client";

import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import { Checkbox } from "@wirefront/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@wirefront/ui/dropdown-menu";
import { Label } from "@wirefront/ui/label";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@wirefront/ui/tabs";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
} from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import {
  BanIcon,
  BotIcon,
  BracesIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  DatabaseIcon,
  EllipsisIcon,
  FileTextIcon,
  HandIcon,
  LinkIcon,
  ListChecksIcon,
  type LucideIcon,
  MinusIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  SearchIcon,
  SendIcon,
  ShieldAlertIcon,
  SparklesIcon,
  SquareTerminalIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import type {
  AgentRun,
  RunAccount,
  RunLogEntry,
  RunOutput,
  RunStepStatus,
  RunToolKind,
} from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("runReplay.<key>"). */
export const RUN_REPLAY_MESSAGES = {
  running: "Running",
  paused: "Paused",
  needsApproval: "Needs approval",
  failed: "Failed",
  completed: "Completed",
  cancelled: "Cancelled",
  runAgain: "Run again",
  pause: "Pause run",
  resume: "Resume run",
  options: "Run options",
  copyLink: "Copy run link",
  exportTrace: "Export trace as JSON",
  cancelRun: "Cancel run",
  timeline: "Timeline",
  plan: "Plan",
  progress: "{done} of {total}",
  calling: "Calling {name}",
  thinking: "Thinking…",
  waitingApproval: "Waiting for your approval",
  failedRetry: "Failed · waiting for retry",
  toolCalls: "{count} tool calls · {time}",
  toolCall: "1 tool call · {time}",
  done: "Done",
  skipped: "Skipped",
  queued: "Queued",
  showCurrent: "Show current step",
  showAll: "Show all {count} steps",
  tokens: "Tokens",
  cost: "Cost",
  toolCallsLabel: "Tool calls",
  model: "Model",
  activityRegion: "Run activity",
  activity: "Activity",
  draft: "Draft",
  newContent: "new",
  reading: "Reading the task…",
  outputRegion: "Draft output",
  output: "Output",
  retry: "retry",
  runningTool: "running",
  blocked: "blocked",
  failedTool: "failed",
  arguments: "arguments",
  tokenCount: "{count} tokens",
  duration: "{ms} ms",
  startedAt: "started at {time}",
  pausedForApproval: "Paused for your approval",
  approvedBy: "Approved by you · {count} recipients",
  deniedBy: "Denied by you · nothing sent",
  approvalRegion: "Approval needed",
  showFewer: "Show fewer",
  showAllAccounts: "Show all {count}",
  approve: "Approve & send {count}",
  deny: "Deny",
  autoApprove: "Auto-approves in {seconds}s · any change pauses it",
  waitingForYou: "Waiting for you",
  failureRegion: "Run failed",
  stepFailed: "Step {n} failed: {title}",
  toolFailed: "{tool} failed:",
  nothingRan: "Nothing after this step has run.",
  retryStep: "Retry step",
  accountsDraft: "{count} accounts · draft 1 of {count}",
  waitingData: "Waiting for data",
  drafting: "Drafting",
  ready: "Ready for review",
  sent: "Sent",
  held: "Kept as draft",
  flagged: "Flagged accounts",
  more: "+{count} more",
  emailDraft: "Email draft",
  to: "To",
  subject: "Subject",
  copy: "Copy",
  copied: "Copied",
  copyFailed: "Couldn’t copy",
  openDrafts: "Open all {count} drafts",
};
type Messages = typeof RUN_REPLAY_MESSAGES;

export interface RunReplayProps {
  run: AgentRun;
  output: RunOutput;
  /** Where the trace head goes next and how long it takes, for smooth playback. */
  traceNext?: { at: number; inMs: number };
  /** A countdown to automatic approval; any change to the recipients should stop it. */
  autoApprove?: { seconds: number; total: number };
  /** Pause or resume. The button is hidden without it. */
  onPausedChange?: (paused: boolean) => void;
  onCancel?: Action;
  onRetry?: Action;
  /** Approve (with the ticked recipients' emails) or deny the paused step. */
  onDecide?: Action<{ approve: boolean; recipients: string[] }>;
  /** Called when the recipients change, e.g. to stop an auto-approve countdown. */
  onRecipientsChange?: (recipients: string[]) => void;
  /** Each shows its control only when given. */
  onRerun?: () => void;
  onCopyLink?: () => void;
  onExportTrace?: () => void;
  onOpenDrafts?: () => void;
  className?: string;
}

type Tone = "info" | "warning" | "success" | "muted" | "destructive";
type ToolLog = Extract<RunLogEntry, { kind: "tool" }>;

const easeOut = [0.23, 1, 0.32, 1] as const;
const spring = { type: "spring", duration: 0.3, bounce: 0 } as const;
const enter = { duration: 0.2, ease: easeOut } as const;
const press =
  "transition-[transform,box-shadow,background-color] duration-150 ease-out active:scale-[0.97]";

const toolMeta: Record<
  RunToolKind,
  { icon: LucideIcon; text: string; bar: string }
> = {
  db: {
    icon: DatabaseIcon,
    text: "text-category-6-foreground",
    bar: "bg-category-6",
  },
  search: { icon: SearchIcon, text: "text-info-foreground", bar: "bg-info" },
  code: {
    icon: SquareTerminalIcon,
    text: "text-category-3-foreground",
    bar: "bg-category-3",
  },
  doc: {
    icon: FileTextIcon,
    text: "text-category-7-foreground",
    bar: "bg-category-7",
  },
  send: {
    icon: SendIcon,
    text: "text-category-5-foreground",
    bar: "bg-category-5",
  },
  task: {
    icon: ListChecksIcon,
    text: "text-success-foreground",
    bar: "bg-success",
  },
};

const toneBg: Record<Tone, string> = {
  destructive: "bg-destructive",
  info: "bg-info",
  warning: "bg-warning",
  success: "bg-success",
  muted: "bg-muted-foreground",
};

function useSecs() {
  const fmt = useFormat();
  return (ms: number) =>
    fmt.number(ms / 1000, {
      style: "unit",
      unit: "second",
      unitDisplay: "narrow",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
}

function LiveDot({ tone, live }: { tone: Tone; live: boolean }) {
  return (
    <span
      aria-hidden
      className="relative inline-flex size-4 shrink-0 items-center justify-center"
    >
      {live ? (
        <motion.span
          animate={{ scale: [1, 2.2], opacity: [0.45, 0] }}
          className={cn("absolute size-2 rounded-full", toneBg[tone])}
          key={tone}
          transition={{
            duration: 1.6,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeOut",
          }}
        />
      ) : null}
      <span
        className={cn(
          "relative size-2 rounded-full transition-colors duration-300",
          toneBg[tone]
        )}
      />
    </span>
  );
}

function Rolling({
  value,
  format,
}: {
  value: number;
  format: (n: number) => string;
}) {
  const reduce = useReducedMotion();
  const mv = useSpring(value, { stiffness: 120, damping: 22 });
  useEffect(() => {
    if (reduce) mv.jump(value);
    else mv.set(value);
  }, [value, reduce, mv]);
  const text = useTransform(mv, format);
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

const nodeIn = { opacity: 0, scale: 0.9 };
const nodeShown = { opacity: 1, scale: 1 };

function StepNode({ status }: { status: RunStepStatus }) {
  const solid = "flex size-5 items-center justify-center rounded-full";
  return (
    <span
      aria-hidden
      className="relative z-10 flex size-5 shrink-0 items-center justify-center bg-background"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {status === "done" ? (
          <motion.span
            animate={nodeShown}
            className={cn(solid, "bg-success text-white")}
            exit={nodeIn}
            initial={nodeIn}
            key="done"
            transition={enter}
          >
            <CheckIcon className="size-3" strokeWidth={3} />
          </motion.span>
        ) : status === "running" ? (
          <motion.span
            animate={nodeShown}
            className="relative size-5"
            exit={nodeIn}
            initial={nodeIn}
            key="run"
            transition={enter}
          >
            <span className="absolute inset-0 rounded-full border-2 border-info/24" />
            <svg
              aria-hidden="true"
              className="absolute inset-0 size-5 animate-spin text-info motion-reduce:animate-none"
              viewBox="0 0 20 20"
            >
              <circle
                cx="10"
                cy="10"
                fill="none"
                r="8"
                stroke="currentColor"
                strokeDasharray="14 60"
                strokeLinecap="round"
                strokeWidth="2.5"
              />
            </svg>
          </motion.span>
        ) : status === "waiting" ? (
          <motion.span
            animate={nodeShown}
            className={cn(solid, "relative bg-warning text-white")}
            exit={nodeIn}
            initial={nodeIn}
            key="wait"
            transition={enter}
          >
            <motion.span
              animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
              className="absolute inset-0 rounded-full bg-warning"
              transition={{
                duration: 1.4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeOut",
              }}
            />
            <HandIcon className="relative size-3" strokeWidth={2.5} />
          </motion.span>
        ) : status === "failed" ? (
          <motion.span
            animate={nodeShown}
            className={cn(solid, "bg-destructive text-white")}
            exit={nodeIn}
            initial={nodeIn}
            key="fail"
            transition={enter}
          >
            <XIcon className="size-3" strokeWidth={3} />
          </motion.span>
        ) : status === "skipped" ? (
          <motion.span
            animate={nodeShown}
            className={cn(solid, "bg-muted text-muted-foreground")}
            exit={nodeIn}
            initial={nodeIn}
            key="skip"
            transition={enter}
          >
            <MinusIcon className="size-3" strokeWidth={3} />
          </motion.span>
        ) : (
          <motion.span
            animate={nodeShown}
            className="size-5 rounded-full border-2 border-input border-dashed"
            exit={nodeIn}
            initial={nodeIn}
            key="pending"
            transition={enter}
          />
        )}
      </AnimatePresence>
    </span>
  );
}

function formatArgs(args: ToolLog["call"]["args"]) {
  return Object.entries(args)
    .map(([k, v]) => `${k}: ${typeof v === "string" ? `"${v}"` : String(v)}`)
    .join(", ");
}

function Waterfall({
  start,
  ms,
  total,
  tone,
  live,
}: {
  start: number;
  ms: number;
  total: number;
  tone: string;
  live: boolean;
}) {
  return (
    <span
      aria-hidden
      className="relative block h-1.5 w-28 overflow-hidden rounded-full bg-muted"
    >
      <motion.span
        animate={{ scaleX: 1, opacity: live ? [0.5, 1, 0.5] : 1 }}
        className={cn(
          "absolute inset-y-0 block min-w-0.5 origin-left rounded-full",
          tone
        )}
        initial={{ scaleX: 0 }}
        style={{
          left: `${(start / total) * 100}%`,
          width: `${Math.max((ms / total) * 100, 2)}%`,
        }}
        transition={
          live
            ? {
                scaleX: spring,
                opacity: {
                  duration: 1.2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                },
              }
            : spring
        }
      />
    </span>
  );
}

function ToolEntry({
  entry,
  total,
  t,
}: {
  entry: ToolLog;
  total: number;
  t: Messages;
}) {
  const fmt = useFormat();
  const secs = useSecs();
  const [open, setOpen] = useState(false);
  const meta = toolMeta[entry.call.kind];
  const panelId = useId();
  const failed = entry.status === "failed" || entry.status === "denied";
  const span =
    entry.end !== undefined ? Math.max(entry.end - entry.at, 1) : entry.call.ms;
  return (
    <div
      className={cn(
        "rounded-lg transition-colors duration-150",
        open && "bg-muted/48"
      )}
    >
      <button
        aria-controls={panelId}
        aria-expanded={open}
        className="grid w-full cursor-pointer grid-cols-[2.5rem_1rem_minmax(0,1fr)_auto] items-start gap-x-3 rounded-lg px-2 py-2 text-start outline-none transition-colors duration-150 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        <span className="pt-px text-end font-mono text-[11px] text-muted-foreground tabular-nums">
          {secs(entry.at)}
        </span>
        <meta.icon
          aria-hidden
          className={cn(
            "mt-px size-4",
            failed ? "text-destructive-foreground" : meta.text
          )}
        />
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "truncate font-medium font-mono text-xs",
                failed && "text-destructive-foreground"
              )}
            >
              {entry.call.name}
            </span>
            {entry.retry ? (
              <span className="shrink-0 rounded bg-muted px-1.5 text-[11px] text-muted-foreground">
                {t.retry}
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block truncate font-mono text-[11px] text-muted-foreground">
            {formatArgs(entry.call.args)}
          </span>
          <AnimatePresence initial={false}>
            {entry.result ? (
              <motion.span
                animate={{ opacity: 1, height: "auto" }}
                className="block overflow-hidden"
                initial={{ opacity: 0, height: 0 }}
                transition={spring}
              >
                <span
                  className={cn(
                    "mt-1 block text-xs",
                    failed ? "text-destructive-foreground" : "text-foreground"
                  )}
                >
                  {entry.result}
                </span>
              </motion.span>
            ) : null}
          </AnimatePresence>
        </span>
        <span className="flex items-center gap-3 pt-px">
          <span className="hidden @md:block">
            <Waterfall
              live={entry.status === "running"}
              ms={span}
              start={entry.at}
              tone={failed ? "bg-destructive" : meta.bar}
              total={total}
            />
          </span>
          <span className="flex w-14 items-center justify-end gap-1 text-muted-foreground text-xs tabular-nums">
            <AnimatePresence initial={false} mode="popLayout">
              {entry.status === "running" ? (
                <motion.span
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5"
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0 }}
                  key="r"
                  transition={enter}
                >
                  <span
                    aria-hidden
                    className="size-1.5 animate-pulse rounded-full bg-info motion-reduce:animate-none"
                  />
                  {t.runningTool}
                </motion.span>
              ) : entry.status === "denied" ? (
                <motion.span
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1 text-destructive-foreground"
                  initial={{ opacity: 0 }}
                  key="x"
                  transition={enter}
                >
                  <BanIcon aria-hidden className="size-3" />
                  {t.blocked}
                </motion.span>
              ) : entry.status === "failed" ? (
                <motion.span
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1 text-destructive-foreground"
                  initial={{ opacity: 0 }}
                  key="f"
                  transition={enter}
                >
                  <TriangleAlertIcon aria-hidden className="size-3" />
                  {t.failedTool}
                </motion.span>
              ) : (
                <motion.span
                  animate={{ opacity: 1 }}
                  initial={{ opacity: 0 }}
                  key="d"
                  transition={enter}
                >
                  {secs(entry.call.ms)}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          <ChevronDownIcon
            aria-hidden
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden"
            exit={{ height: 0, opacity: 0 }}
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            transition={spring}
          >
            <div className="ms-19 me-2 mb-2 grid gap-2 rounded-lg border bg-background p-3 font-mono text-xs dark:bg-input/24">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <BracesIcon aria-hidden className="size-3" />
                {t.arguments}
              </div>
              <pre className="overflow-x-auto whitespace-pre text-foreground">
                {JSON.stringify(entry.call.args, null, 2)}
              </pre>
              <div className="flex flex-wrap gap-x-4 gap-y-1 border-t pt-2 text-muted-foreground">
                <span>
                  {interpolate(t.tokenCount, {
                    count: fmt.number(entry.call.tokens),
                  })}
                </span>
                <span>
                  {interpolate(t.duration, { ms: fmt.number(entry.call.ms) })}
                </span>
                <span>
                  {interpolate(t.startedAt, { time: secs(entry.at) })}
                </span>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function CountdownRing({ value, total }: { value: number; total: number }) {
  const c = 2 * Math.PI * 9;
  return (
    <span
      aria-hidden
      className="relative flex size-7 shrink-0 items-center justify-center"
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0 -rotate-90"
        viewBox="0 0 24 24"
      >
        <circle
          className="stroke-warning/20"
          cx="12"
          cy="12"
          fill="none"
          r="9"
          strokeWidth="2.5"
        />
        <motion.circle
          animate={{ strokeDashoffset: c * (1 - value / total) }}
          className="stroke-warning"
          cx="12"
          cy="12"
          fill="none"
          r="9"
          strokeDasharray={c}
          strokeLinecap="round"
          strokeWidth="2.5"
          transition={{ duration: 0.9, ease: "linear" }}
        />
      </svg>
      <span className="font-medium text-[10px] tabular-nums">{value}</span>
    </span>
  );
}

function ApprovalCard({
  title,
  description,
  accounts,
  selected,
  onToggle,
  autoApprove,
  pending,
  onApprove,
  onDeny,
  t,
}: {
  title: string;
  description: string;
  accounts: RunAccount[];
  selected: string[];
  onToggle: (email: string) => void;
  autoApprove?: { seconds: number; total: number };
  pending: boolean;
  onApprove: () => void;
  onDeny: () => void;
  t: Messages;
}) {
  const fmt = useFormat();
  const [all, setAll] = useState(false);
  const shown = all ? accounts : accounts.slice(0, 4);
  return (
    <motion.section
      animate={{ opacity: 1, y: 0, scale: 1 }}
      aria-label={t.approvalRegion}
      className="mx-4 mt-4 shrink-0 rounded-2xl border border-warning/40 bg-warning/6 p-4"
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      layout
      transition={{ ...enter, layout: spring }}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/16 text-warning-foreground"
        >
          <ShieldAlertIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-balance font-medium">
            {title}{" "}
            <span className="text-muted-foreground tabular-nums">
              ({selected.length})
            </span>
          </h3>
          <p className="mt-0.5 text-pretty text-muted-foreground text-xs">
            {description}
          </p>
        </div>
        {autoApprove ? (
          <CountdownRing
            total={autoApprove.total}
            value={autoApprove.seconds}
          />
        ) : null}
      </div>

      <ul className="mt-3 grid max-h-52 gap-1 overflow-y-auto @md:grid-cols-2">
        <AnimatePresence initial={false}>
          {shown.map((a) => {
            const on = selected.includes(a.email);
            return (
              <motion.li
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                initial={{ opacity: 0, height: 0 }}
                key={a.email}
                transition={spring}
              >
                <Label
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 font-normal transition-colors hover:bg-warning/8",
                    !on && "opacity-56"
                  )}
                >
                  <Checkbox
                    checked={on}
                    onCheckedChange={() => onToggle(a.email)}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate font-medium text-xs",
                        !on && "line-through"
                      )}
                    >
                      {a.contact}
                    </span>
                    <span className="block truncate text-muted-foreground text-xs">
                      {a.company}
                    </span>
                  </span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {fmt.number(a.score, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </Label>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      {accounts.length > 4 ? (
        <button
          className="mt-1 inline-flex h-8 cursor-pointer items-center rounded-md px-2 text-muted-foreground text-xs underline-offset-2 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setAll((v) => !v)}
          type="button"
        >
          {all
            ? t.showFewer
            : interpolate(t.showAllAccounts, { count: accounts.length })}
        </button>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          className={press}
          disabled={selected.length === 0 || pending}
          onClick={onApprove}
          size="sm"
        >
          <SendIcon />
          {interpolate(t.approve, { count: selected.length })}
        </Button>
        <Button
          className={press}
          disabled={pending}
          onClick={onDeny}
          size="sm"
          variant="outline"
        >
          {t.deny}
        </Button>
        <span className="text-pretty text-muted-foreground text-xs tabular-nums">
          {autoApprove
            ? interpolate(t.autoApprove, { seconds: autoApprove.seconds })
            : t.waitingForYou}
        </span>
      </div>
    </motion.section>
  );
}

function FailureCard({
  step,
  stepTitle,
  toolName,
  message,
  onRetry,
  onCancel,
  t,
}: {
  step: number;
  stepTitle: string;
  toolName?: string;
  message: string;
  onRetry?: () => void;
  onCancel?: () => void;
  t: Messages;
}) {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0, scale: 1 }}
      aria-label={t.failureRegion}
      className="mx-4 mt-4 shrink-0 rounded-2xl border border-destructive/32 bg-destructive/4 p-4"
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      layout
      role="alert"
      transition={{ ...enter, layout: spring }}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/12 text-destructive-foreground"
        >
          <TriangleAlertIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-balance font-medium">
            {interpolate(t.stepFailed, { n: step + 1, title: stepTitle })}
          </h3>
          <p className="mt-0.5 text-pretty text-muted-foreground text-xs">
            {toolName ? (
              <span className="font-mono">
                {interpolate(t.toolFailed, { tool: toolName })}
              </span>
            ) : null}{" "}
            <span className="text-destructive-foreground">{message}</span>{" "}
            {t.nothingRan}
          </p>
        </div>
      </div>
      {onRetry || onCancel ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 ps-11">
          {onRetry ? (
            <Button className={press} onClick={onRetry} size="sm">
              <RotateCcwIcon />
              {t.retryStep}
            </Button>
          ) : null}
          {onCancel ? (
            <Button
              className={press}
              onClick={onCancel}
              size="sm"
              variant="outline"
            >
              {t.cancelRun}
            </Button>
          ) : null}
        </div>
      ) : null}
    </motion.section>
  );
}

function ActivityLog({
  log,
  titles,
  total,
  t,
}: {
  log: RunLogEntry[];
  titles: string[];
  total: number;
  t: Messages;
}) {
  const secs = useSecs();
  return (
    <ol className="flex flex-col">
      <AnimatePresence initial={false}>
        {log.map((e, i) => {
          const first = i === 0 || log[i - 1]?.step !== e.step;
          return (
            <motion.li
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 4 }}
              key={e.id}
              layout="position"
              transition={{ ...enter, layout: spring }}
            >
              {first ? (
                <div
                  className={cn(
                    "flex items-center gap-2 px-2 pb-1 text-muted-foreground text-xs",
                    i === 0 ? "pt-0" : "pt-4"
                  )}
                >
                  <span className="flex size-4 items-center justify-center rounded bg-muted font-medium text-[10px] tabular-nums">
                    {e.step + 1}
                  </span>
                  <span className="truncate font-medium">{titles[e.step]}</span>
                </div>
              ) : null}
              {e.kind === "tool" ? (
                <ToolEntry entry={e} t={t} total={total} />
              ) : (
                <div className="grid grid-cols-[2.5rem_1rem_minmax(0,1fr)] items-start gap-x-3 px-2 py-2 text-xs">
                  <span className="pt-px text-end font-mono text-[11px] text-muted-foreground tabular-nums">
                    {secs(e.at)}
                  </span>
                  {e.kind === "thought" ? (
                    <>
                      <SparklesIcon
                        aria-hidden
                        className="mt-px size-4 text-muted-foreground"
                      />
                      <span className="text-pretty text-muted-foreground italic leading-relaxed">
                        {e.text}
                      </span>
                    </>
                  ) : (
                    <>
                      {e.status === "waiting" ? (
                        <HandIcon
                          aria-hidden
                          className="mt-px size-4 text-warning-foreground"
                        />
                      ) : e.status === "approved" ? (
                        <CheckIcon
                          aria-hidden
                          className="mt-px size-4 text-success-foreground"
                        />
                      ) : (
                        <BanIcon
                          aria-hidden
                          className="mt-px size-4 text-destructive-foreground"
                        />
                      )}
                      <span
                        className={cn(
                          "pt-px",
                          e.status === "waiting" &&
                            "font-medium text-warning-foreground",
                          e.status === "approved" && "text-foreground",
                          e.status === "denied" && "text-destructive-foreground"
                        )}
                      >
                        {e.status === "waiting"
                          ? t.pausedForApproval
                          : e.status === "approved"
                            ? interpolate(t.approvedBy, { count: e.count })
                            : t.deniedBy}
                      </span>
                    </>
                  )}
                </div>
              )}
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ol>
  );
}

function TraceStrip({
  log,
  total,
  head,
  next,
  t,
}: {
  log: RunLogEntry[];
  total: number;
  head: number;
  next?: { at: number; inMs: number };
  t: Messages;
}) {
  const reduce = useReducedMotion();
  const secs = useSecs();
  const tools = log.filter((e): e is ToolLog => e.kind === "tool");
  const marks = log.filter((e) => e.kind !== "tool");
  const target = Math.min((next?.at ?? head) / total, 1);
  const duration = next ? next.inMs / 1000 : 0.2;
  return (
    <div className="flex items-center gap-3 border-b px-4 py-2.5">
      <span className="hidden w-14 shrink-0 font-medium text-muted-foreground text-xs @md:block">
        {t.timeline}
      </span>
      <div aria-hidden className="relative h-5 min-w-0 flex-1">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
        <motion.div
          animate={{ scaleX: target }}
          className="absolute inset-y-0 inset-s-0 w-full origin-left rounded-sm bg-foreground/4 dark:bg-foreground/6"
          initial={false}
          transition={reduce ? { duration: 0 } : { duration, ease: "linear" }}
        />
        {tools.map((e) => {
          const meta = toolMeta[e.call.kind];
          const failed = e.status === "failed" || e.status === "denied";
          const span =
            e.end !== undefined ? Math.max(e.end - e.at, 1) : e.call.ms;
          return (
            <motion.span
              animate={{ opacity: 1, scaleY: 1 }}
              className={cn(
                "absolute top-1/2 h-2.5 -translate-y-1/2 rounded-[calc(var(--radius)*0.3)]",
                failed ? "bg-destructive" : meta.bar,
                e.status === "running" &&
                  "animate-pulse motion-reduce:animate-none"
              )}
              initial={{ opacity: 0, scaleY: 0.4 }}
              key={e.id}
              style={{
                left: `${(e.at / total) * 100}%`,
                width: `max(3px, ${(span / total) * 100}%)`,
              }}
              title={`${e.call.name} · ${secs(span)}`}
              transition={enter}
            />
          );
        })}
        {marks.map((e) => (
          <span
            className={cn(
              "absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
              e.kind === "approval" ? "bg-warning" : "bg-muted-foreground/56"
            )}
            key={e.id}
            style={{ left: `${(e.at / total) * 100}%` }}
          />
        ))}
        <motion.div
          animate={{ x: `${target * 100}%` }}
          className="pointer-events-none absolute inset-0"
          initial={false}
          transition={reduce ? { duration: 0 } : { duration, ease: "linear" }}
        >
          <span className="absolute inset-y-0 inset-s-0 w-px bg-foreground/48" />
        </motion.div>
      </div>
      <span className="shrink-0 whitespace-nowrap text-end font-mono text-[11px] text-muted-foreground tabular-nums">
        {secs(head)} / {secs(total)}
      </span>
    </div>
  );
}

function DraftOutput({
  output,
  onOpenDrafts,
  t,
}: {
  output: RunOutput;
  onOpenDrafts?: () => void;
  t: Messages;
}) {
  const fmt = useFormat();
  const { accounts, email, state } = output;
  const visibleRows = accounts.slice(0, 5);
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  useEffect(() => {
    if (copy === "idle") return;
    const id = setTimeout(() => setCopy("idle"), 1400);
    return () => clearTimeout(id);
  }, [copy]);
  const ready = state !== "drafting" && Boolean(email);
  const badge = {
    drafting: (
      <Badge
        className="bg-info/8 text-info-foreground dark:bg-info/16"
        variant="secondary"
      >
        {t.drafting}
      </Badge>
    ),
    ready: (
      <Badge
        className="bg-warning/8 text-warning-foreground dark:bg-warning/16"
        variant="secondary"
      >
        {t.ready}
      </Badge>
    ),
    sent: (
      <Badge
        className="bg-success/8 text-success-foreground dark:bg-success/16"
        variant="secondary"
      >
        {t.sent}
      </Badge>
    ),
    held: <Badge variant="secondary">{t.held}</Badge>,
  }[state];

  return (
    <div className="rounded-2xl border bg-card">
      <div className="flex items-center gap-3 border-b p-4">
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-lg bg-category-7/12 text-category-7-foreground"
        >
          <FileTextIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{output.title}</div>
          <div className="text-muted-foreground text-xs tabular-nums">
            {accounts.length > 0
              ? interpolate(t.accountsDraft, { count: accounts.length })
              : t.waitingData}
          </div>
        </div>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            initial={{ scale: 0.95, opacity: 0 }}
            key={state}
            transition={enter}
          >
            {badge}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="p-4">
        <h4 className="mb-2 font-medium text-muted-foreground text-xs">
          {t.flagged}
        </h4>
        <div className="rounded-xl border">
          {accounts.length === 0 ? (
            ["a", "b", "c"].map((k) => (
              <div
                className="flex items-center gap-3 border-b px-3 py-2.5 last:border-0"
                key={k}
              >
                <Skeleton className="h-3 w-28 motion-reduce:animate-none" />
                <Skeleton className="ms-auto h-1.5 w-16 rounded-full motion-reduce:animate-none" />
                <Skeleton className="h-3 w-8 motion-reduce:animate-none" />
              </div>
            ))
          ) : (
            <AnimatePresence initial={false}>
              {visibleRows.map((a) => (
                <motion.div
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 border-b px-3 py-2 last:border-0"
                  initial={{ opacity: 0, x: -6 }}
                  key={a.email}
                  transition={enter}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-xs">
                      {a.company}
                    </span>
                    <span className="block truncate text-muted-foreground text-xs">
                      {a.contact}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"
                  >
                    <motion.span
                      animate={{ scaleX: a.score }}
                      className={cn(
                        "block h-full origin-left rounded-full rtl:origin-right",
                        a.score >= 0.75 ? "bg-destructive" : "bg-warning"
                      )}
                      initial={{ scaleX: 0 }}
                      transition={{ ...spring, delay: 0.1 }}
                    />
                  </span>
                  <span className="w-8 text-end font-medium text-xs tabular-nums">
                    {fmt.number(a.score, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="hidden w-11 text-end text-muted-foreground text-xs tabular-nums @md:block">
                    {a.arr}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {accounts.length > 5 ? (
            <div className="px-3 py-2 text-muted-foreground text-xs">
              {interpolate(t.more, { count: accounts.length - 5 })}
            </div>
          ) : null}
        </div>

        <h4 className="mt-5 mb-2 font-medium text-muted-foreground text-xs">
          {t.emailDraft}
        </h4>
        <div className="rounded-xl border p-3">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-b pb-2.5 text-xs">
            <dt className="text-muted-foreground">{t.to}</dt>
            <dd className="truncate">
              {email ? (
                email.to
              ) : (
                <Skeleton className="mt-0.5 h-3 w-40 motion-reduce:animate-none" />
              )}
            </dd>
            <dt className="text-muted-foreground">{t.subject}</dt>
            <dd className="truncate font-medium">
              {email ? (
                email.subject
              ) : (
                <Skeleton className="mt-0.5 h-3 w-52 motion-reduce:animate-none" />
              )}
            </dd>
          </dl>
          <div className="mt-2.5 flex min-h-6 flex-wrap gap-1">
            {email
              ? email.highlights.map((h, i) => (
                  <motion.span
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-full bg-info/10 px-2 py-0.5 text-info-foreground text-xs"
                    initial={{ opacity: 0, scale: 0.95 }}
                    key={h}
                    transition={{ ...enter, delay: 0.03 * i }}
                  >
                    {h}
                  </motion.span>
                ))
              : ["a", "b", "c"].map((k) => (
                  <Skeleton
                    className="h-6 w-24 rounded-full motion-reduce:animate-none"
                    key={k}
                  />
                ))}
          </div>
          <div className="mt-2.5 min-h-24 whitespace-pre-line text-sm/6">
            {email ? (
              <>
                {email.body}
                {state === "drafting" ? (
                  <motion.span
                    animate={{ opacity: [1, 0.2, 1] }}
                    aria-hidden
                    className="ms-0.5 inline-block h-4 w-1.5 translate-y-0.5 rounded-full bg-foreground/60"
                    transition={{
                      duration: 0.9,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  />
                ) : null}
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Skeleton className="h-3 w-full motion-reduce:animate-none" />
                <Skeleton className="h-3 w-11/12 motion-reduce:animate-none" />
                <Skeleton className="h-3 w-3/4 motion-reduce:animate-none" />
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            className={cn(press, "min-w-22")}
            disabled={!ready}
            onClick={() => {
              if (!email) return;
              if (!navigator.clipboard) {
                setCopy("failed");
                return;
              }
              navigator.clipboard.writeText(email.body).then(
                () => setCopy("copied"),
                () => setCopy("failed")
              );
            }}
            size="sm"
            variant="outline"
          >
            {copy === "copied" ? <CheckIcon /> : <CopyIcon />}
            {copy === "copied"
              ? t.copied
              : copy === "failed"
                ? t.copyFailed
                : t.copy}
          </Button>
          {onOpenDrafts ? (
            <Button
              className={press}
              disabled={!ready}
              onClick={onOpenDrafts}
              size="sm"
              variant="ghost"
            >
              {interpolate(t.openDrafts, { count: accounts.length })}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RunReplayScreen({
  run,
  output,
  traceNext,
  autoApprove,
  onPausedChange,
  onCancel,
  onRetry,
  onDecide,
  onRecipientsChange,
  onRerun,
  onCopyLink,
  onExportTrace,
  onOpenDrafts,
  className,
}: RunReplayProps) {
  const t = useMessages("runReplay", RUN_REPLAY_MESSAGES);
  const fmt = useFormat();
  const secs = useSecs();
  const [tab, setTab] = useState<"activity" | "draft">("activity");
  const [planOpen, setPlanOpen] = useState(false);
  const tabsId = useId();
  const logRef = useRef<HTMLDivElement>(null);

  // Everyone starts ticked each time the run pauses for approval.
  const approvalKey = run.approval ? `${run.approval.step}` : null;
  const [selection, setSelection] = useState<{
    key: string | null;
    emails: string[];
  }>({ key: approvalKey, emails: output.accounts.map((a) => a.email) });
  const selected =
    selection.key === approvalKey
      ? selection.emails
      : output.accounts.map((a) => a.email);
  const toggle = (email: string) => {
    const next = selected.includes(email)
      ? selected.filter((x) => x !== email)
      : [...selected, email];
    setSelection({ key: approvalKey, emails: next });
    onRecipientsChange?.(next);
  };

  // Show a dot on the Draft tab when the output grows while another tab is open.
  const outputSize = output.accounts.length + (output.email?.body.length ?? 0);
  const [seenDraft, setSeenDraft] = useState(outputSize);
  if (tab === "draft" && seenDraft !== outputSize) setSeenDraft(outputSize);
  const draftFresh = tab !== "draft" && outputSize > seenDraft;

  const decide = useAction(onDecide ?? (async () => {}));
  const cancel = useAction(onCancel ?? (async () => {}));
  const retry = useAction(onRetry ?? (async () => {}));
  const error = decide.error ?? cancel.error ?? retry.error;

  // Follow the log as it grows when it scrolls on its own (wide layouts).
  useEffect(() => {
    const viewport = logRef.current;
    const content = viewport?.firstElementChild;
    if (!viewport || !content) return;
    const ro = new ResizeObserver(() => {
      if (viewport.scrollHeight > viewport.clientHeight)
        viewport.scrollTo?.({ top: viewport.scrollHeight, behavior: "smooth" });
    });
    ro.observe(content);
    return () => ro.disconnect();
  }, []);

  const finished = run.status === "completed" || run.status === "cancelled";
  const doneCount = run.steps.filter(
    (s) => s.status === "done" || s.status === "skipped"
  ).length;
  const toolCalls = run.log.filter((e) => e.kind === "tool").length;
  const liveStep = run.steps.findIndex(
    (s) =>
      s.status === "running" || s.status === "waiting" || s.status === "failed"
  );
  let lastTouched = -1;
  for (let i = run.steps.length - 1; i >= 0; i--) {
    if (run.steps[i]?.status !== "pending") {
      lastTouched = i;
      break;
    }
  }
  const activeStep = liveStep >= 0 ? liveStep : Math.max(lastTouched, 0);
  const status: { label: string; tone: Tone; live: boolean } = {
    cancelled: { label: t.cancelled, tone: "muted" as Tone, live: false },
    failed: { label: t.failed, tone: "destructive" as Tone, live: false },
    completed: { label: t.completed, tone: "success" as Tone, live: false },
    waiting: { label: t.needsApproval, tone: "warning" as Tone, live: true },
    paused: { label: t.paused, tone: "muted" as Tone, live: false },
    running: { label: t.running, tone: "info" as Tone, live: true },
  }[run.status];
  const elapsed = Math.floor(run.elapsedMs / 1000);
  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const titles = run.steps.map((s) => s.title);
  const hasMenu = Boolean(onCopyLink || onExportTrace || onCancel);
  const draft = (
    <DraftOutput onOpenDrafts={onOpenDrafts} output={output} t={t} />
  );

  const stepMeta = (i: number) => {
    const s = run.steps[i];
    if (!s) return "";
    const calls = run.log.filter(
      (e): e is ToolLog => e.kind === "tool" && e.step === i
    );
    const ms = calls.reduce(
      (n, c) => n + (c.status === "done" ? c.call.ms : 0),
      0
    );
    switch (s.status) {
      case "running":
        return calls.length > 0
          ? interpolate(t.calling, { name: calls.at(-1)?.call.name ?? "" })
          : t.thinking;
      case "waiting":
        return t.waitingApproval;
      case "failed":
        return t.failedRetry;
      case "done":
        return calls.length
          ? interpolate(calls.length === 1 ? t.toolCall : t.toolCalls, {
              count: calls.length,
              time: secs(ms),
            })
          : t.done;
      case "skipped":
        return t.skipped;
      default:
        return s.approval ? t.needsApproval : t.queued;
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={cn(
          "@container relative isolate flex h-svh w-full flex-col overflow-hidden bg-background text-foreground text-sm",
          className
        )}
      >
        <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2.5">
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-card text-foreground shadow-xs/5"
          >
            <BotIcon className="size-4" />
          </span>
          <div className="min-w-48 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-medium">{run.agentName}</h2>
              <span className="hidden truncate rounded-md bg-muted px-1.5 font-mono text-[11px] text-muted-foreground @md:inline">
                {run.id}
              </span>
            </div>
            <p className="truncate text-muted-foreground text-xs">{run.task}</p>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <span
              aria-live="polite"
              className="inline-flex h-7 items-center gap-1.5 rounded-full border bg-card ps-2 pe-2.5 font-medium text-xs"
            >
              <LiveDot live={status.live} tone={status.tone} />
              <AnimatePresence initial={false} mode="wait">
                <motion.span
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  initial={{ opacity: 0, y: 6 }}
                  key={status.label}
                  transition={enter}
                >
                  {status.label}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="w-10 text-center text-muted-foreground text-xs tabular-nums">
              {mmss}
            </span>
            {finished ? (
              onRerun ? (
                <Button
                  className={press}
                  onClick={onRerun}
                  size="sm"
                  variant="outline"
                >
                  <RotateCcwIcon />
                  {t.runAgain}
                </Button>
              ) : null
            ) : onPausedChange ? (
              <Button
                aria-label={run.status === "paused" ? t.resume : t.pause}
                className={press}
                disabled={run.status === "failed"}
                onClick={() => onPausedChange(run.status !== "paused")}
                size="icon-sm"
                variant="outline"
              >
                {run.status === "paused" ? <PlayIcon /> : <PauseIcon />}
              </Button>
            ) : null}
            {hasMenu ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      aria-label={t.options}
                      className={press}
                      size="icon-sm"
                      variant="ghost"
                    />
                  }
                >
                  <EllipsisIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onCopyLink ? (
                    <DropdownMenuItem onClick={onCopyLink}>
                      <LinkIcon />
                      {t.copyLink}
                    </DropdownMenuItem>
                  ) : null}
                  {onExportTrace ? (
                    <DropdownMenuItem onClick={onExportTrace}>
                      <BracesIcon />
                      {t.exportTrace}
                    </DropdownMenuItem>
                  ) : null}
                  {onCancel ? (
                    <>
                      {onCopyLink || onExportTrace ? (
                        <DropdownMenuSeparator />
                      ) : null}
                      <DropdownMenuItem
                        disabled={finished}
                        onClick={() => cancel.run()}
                        variant="destructive"
                      >
                        <BanIcon />
                        {t.cancelRun}
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </header>

        <TraceStrip
          head={run.headMs}
          log={run.log}
          next={traceNext}
          t={t}
          total={run.totalMs}
        />

        {error ? (
          <p
            className="shrink-0 border-b bg-destructive/8 px-4 py-2 text-destructive text-xs"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-[minmax(0,1fr)] overflow-y-auto @3xl:auto-rows-auto @3xl:grid-cols-[17.5rem_minmax(0,1fr)] @3xl:overflow-hidden @6xl:grid-cols-[17.5rem_minmax(0,1fr)_minmax(0,26rem)]">
          <aside
            aria-label={t.plan}
            className="flex flex-col gap-4 border-b p-4 @3xl:overflow-y-auto @3xl:border-e @3xl:border-b-0"
          >
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="font-medium">{t.plan}</h3>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {interpolate(t.progress, {
                    done: doneCount,
                    total: run.steps.length,
                  })}
                </span>
              </div>
              <div
                aria-hidden
                className="h-1 overflow-hidden rounded-full bg-muted"
              >
                <motion.div
                  animate={{
                    scaleX: run.steps.length ? doneCount / run.steps.length : 0,
                  }}
                  className="h-full origin-left rounded-full bg-success rtl:origin-right"
                  initial={false}
                  transition={spring}
                />
              </div>
            </div>
            <ol className="flex flex-col">
              {run.steps.map((s, i) => {
                const last = i === run.steps.length - 1;
                const collapsed = !planOpen && i !== activeStep;
                return (
                  <li
                    className={cn(
                      "relative gap-3 pb-4 last:pb-0 @3xl:flex",
                      collapsed ? "hidden" : "flex",
                      !planOpen && "@max-3xl:pb-0"
                    )}
                    key={s.title}
                  >
                    {last ? null : (
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-s-2.25 top-6 bottom-1 w-0.5 overflow-hidden rounded-full bg-border",
                          !planOpen && "hidden @3xl:block"
                        )}
                      >
                        <motion.span
                          animate={{
                            scaleY:
                              s.status === "done" || s.status === "skipped"
                                ? 1
                                : 0,
                          }}
                          className="block h-full origin-top bg-success"
                          initial={false}
                          transition={spring}
                        />
                      </span>
                    )}
                    <StepNode status={s.status} />
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          "font-medium transition-colors",
                          s.status === "pending" && "text-muted-foreground",
                          s.status === "skipped" &&
                            "text-muted-foreground line-through",
                          s.status === "failed" && "text-destructive-foreground"
                        )}
                      >
                        {s.title}
                      </div>
                      <div className="text-muted-foreground text-xs tabular-nums">
                        {stepMeta(i)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
            <button
              aria-expanded={planOpen}
              className="-my-2 -ms-2 flex h-8 cursor-pointer items-center gap-1 self-start rounded-md px-2 text-muted-foreground text-xs outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring @3xl:hidden"
              onClick={() => setPlanOpen((o) => !o)}
              type="button"
            >
              {planOpen
                ? t.showCurrent
                : interpolate(t.showAll, { count: run.steps.length })}
              <ChevronDownIcon
                aria-hidden
                className={cn(
                  "size-3.5 transition-transform",
                  planOpen && "rotate-180"
                )}
              />
            </button>
            <dl className="grid grid-cols-3 gap-x-3 gap-y-1.5 border-t pt-3 text-xs @3xl:mt-auto @3xl:grid-cols-1">
              <div className="flex min-w-0 flex-col gap-0.5 @3xl:flex-row @3xl:justify-between">
                <dt className="text-muted-foreground">{t.tokens}</dt>
                <dd className="truncate font-medium tabular-nums">
                  <Rolling
                    format={(n) => fmt.number(Math.round(n))}
                    value={run.tokens}
                  />
                </dd>
              </div>
              <div className="flex min-w-0 flex-col gap-0.5 @3xl:flex-row @3xl:justify-between">
                <dt className="text-muted-foreground">{t.cost}</dt>
                <dd className="truncate font-medium tabular-nums">
                  <Rolling
                    format={(n) =>
                      fmt.money(n, "USD", {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      })
                    }
                    value={run.cost}
                  />
                </dd>
              </div>
              <div className="flex min-w-0 flex-col gap-0.5 @3xl:flex-row @3xl:justify-between">
                <dt className="text-muted-foreground">{t.toolCallsLabel}</dt>
                <dd className="truncate font-medium tabular-nums">
                  <Rolling
                    format={(n) => fmt.number(Math.round(n))}
                    value={toolCalls}
                  />
                </dd>
              </div>
              <div className="hidden min-w-0 flex-col gap-0.5 @3xl:flex @3xl:flex-row @3xl:justify-between">
                <dt className="text-muted-foreground">{t.model}</dt>
                <dd className="truncate font-medium font-mono text-[11px]">
                  {run.model}
                </dd>
              </div>
            </dl>
          </aside>

          <section
            aria-label={t.activityRegion}
            className="flex min-h-0 flex-col @3xl:overflow-hidden"
          >
            <Tabs
              className="shrink-0 px-4 pt-4 @6xl:hidden"
              onValueChange={(v) => setTab(v as "activity" | "draft")}
              value={tab}
            >
              <TabsList>
                <TabsTrigger
                  aria-controls={`${tabsId}-activity`}
                  className="text-foreground/70"
                  value="activity"
                >
                  {t.activity}
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {run.log.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  aria-controls={`${tabsId}-draft`}
                  className="text-foreground/70"
                  value="draft"
                >
                  {t.draft}
                  <AnimatePresence>
                    {draftFresh ? (
                      <motion.span
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative size-1.5 rounded-full bg-info"
                        exit={{ opacity: 0, scale: 0.9 }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        transition={enter}
                      >
                        <span className="sr-only">{t.newContent}</span>
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <AnimatePresence initial={false}>
              {run.approval && onDecide ? (
                <ApprovalCard
                  accounts={output.accounts}
                  autoApprove={autoApprove}
                  description={run.approval.description}
                  key="approval"
                  onApprove={() =>
                    decide.run({ approve: true, recipients: selected })
                  }
                  onDeny={() => decide.run({ approve: false, recipients: [] })}
                  onToggle={toggle}
                  pending={decide.isPending()}
                  selected={selected}
                  t={t}
                  title={run.approval.title}
                />
              ) : null}
              {run.failure ? (
                <FailureCard
                  key="failure"
                  message={run.failure.message}
                  onCancel={onCancel ? () => cancel.run() : undefined}
                  onRetry={onRetry ? () => retry.run() : undefined}
                  step={run.failure.step}
                  stepTitle={titles[run.failure.step] ?? ""}
                  t={t}
                  toolName={run.failure.toolName}
                />
              ) : null}
            </AnimatePresence>
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col gap-3 p-4 @3xl:overflow-y-auto",
                run.approval || run.failure
                  ? "@3xl:mask-[linear-gradient(to_bottom,transparent_0.75rem,black_2.75rem)]"
                  : "@3xl:mask-[linear-gradient(to_bottom,transparent,black_1.25rem)]"
              )}
              ref={logRef}
            >
              <div>
                <div
                  className={cn(
                    tab === "activity" ? "block" : "hidden",
                    "@6xl:block"
                  )}
                  id={`${tabsId}-activity`}
                  role="tabpanel"
                >
                  <h3 className="mb-2 hidden font-medium @6xl:block">
                    {t.activity}
                  </h3>
                  {run.log.length === 0 ? (
                    <div className="flex items-center gap-2 px-1 py-2 text-muted-foreground text-xs">
                      <span
                        aria-hidden
                        className="size-1.5 animate-pulse rounded-full bg-info motion-reduce:animate-none"
                      />
                      {t.reading}
                    </div>
                  ) : (
                    <ActivityLog
                      log={run.log}
                      t={t}
                      titles={titles}
                      total={run.totalMs}
                    />
                  )}
                </div>
                <div
                  className={cn(
                    tab === "draft" ? "block" : "hidden",
                    "@6xl:hidden"
                  )}
                  id={`${tabsId}-draft`}
                  role="tabpanel"
                >
                  {draft}
                </div>
              </div>
            </div>
          </section>

          <section
            aria-label={t.outputRegion}
            className="hidden border-s p-4 @6xl:block @6xl:overflow-y-auto"
          >
            <h3 className="mb-2 font-medium">{t.output}</h3>
            {draft}
          </section>
        </div>
      </div>
    </MotionConfig>
  );
}

export function RunReplay(props: RunReplayProps) {
  return (
    <ScreenBoundary name="RunReplay">
      <RunReplayScreen {...props} />
    </ScreenBoundary>
  );
}
