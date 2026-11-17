// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: replays a scripted run in devl.dev's frame. Tool calls play out on a timer, one
// call fails once and retries, and the send step auto-approves after a countdown unless you touch
// the recipients. Not shipped by the registry; builders stream runs from their agent backend.
import { useEffect, useMemo, useReducer, useState } from "react";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import type { AgentRun, RunLogEntry, RunOutput, RunStepStatus, RunToolCall } from "./schema";
import { RunReplay } from "./view";

type Call = RunToolCall & { result: string };
type Ev =
  | { k: "step"; i: number; s: RunStepStatus; d: number }
  | { k: "tool"; id: string; step: number; call: Call; d: number; retry?: boolean }
  | { k: "toolDone"; id: string; d: number }
  | { k: "toolFail"; id: string; message: string; d: number }
  | { k: "denied"; id: string; step: number; call: Call; d: number }
  | { k: "thought"; id: string; step: number; text: string; d: number }
  | { k: "row"; d: number }
  | { k: "words"; n: number; d: number }
  | { k: "approval"; id: string; step: number; d: number }
  | { k: "finish"; d: number };

interface State {
  cursor: number;
  steps: RunStepStatus[];
  log: RunLogEntry[];
  tokens: number;
  rows: number;
  words: number;
  awaiting: { id: string; step: number } | null;
  finished: boolean;
  cancelled: boolean;
  decision: { approve: boolean; count: number } | null;
}
type Event = { type: "ev"; ev: Ev; at: number } | { type: "decide"; approve: boolean; count: number } | { type: "cancel" } | { type: "reset" };

const SPEED = 1;
const AUTO_APPROVE = 12;
const ROWS = Math.min(fixtures.accounts.length, 5);
const WORDS = fixtures.email.body.split(" ").length;

function buildEvents(decision: State["decision"]): Ev[] {
  const ev: Ev[] = [];
  fixtures.steps.forEach((step, i) => {
    if (ev.at(-1)?.k === "approval" && !decision) return;
    ev.push({ k: "step", i, s: "running", d: i === 0 ? 700 : 450 });
    (step.tools ?? []).forEach((call, j) => {
      const id = `${i}-${j}`;
      ev.push({ k: "tool", id, step: i, call, d: 380 });
      if (call.failsOnce) {
        ev.push({ k: "toolFail", id, message: call.failsOnce, d: Math.round(call.ms * 0.6) });
        ev.push({ k: "tool", id: `${id}-r`, step: i, call, d: 2000, retry: true });
        ev.push({ k: "toolDone", id: `${id}-r`, d: call.ms });
      } else ev.push({ k: "toolDone", id, d: call.ms });
    });
    if (step.reveal === "accounts") for (let r = 0; r < ROWS; r++) ev.push({ k: "row", d: r === 0 ? 300 : 140 });
    if (step.reveal === "email") for (let w = 0; w < WORDS; w += 3) ev.push({ k: "words", n: 3, d: w === 0 ? 400 : 55 });
    if (step.thought) ev.push({ k: "thought", id: `t-${i}`, step: i, text: step.thought, d: 650 });
    if (step.approval) {
      ev.push({ k: "approval", id: `ap-${i}`, step: i, d: 600 });
      if (!decision) return;
      const id = `${i}-send`;
      if (decision.approve) {
        const call = { ...step.approval.tool, result: step.approval.tool.result.replace("{n}", String(decision.count)) };
        ev.push({ k: "tool", id, step: i, call, d: 350 }, { k: "toolDone", id, d: call.ms });
      } else ev.push({ k: "denied", id, step: i, call: step.approval.tool, d: 300 });
      ev.push({ k: "step", i, s: decision.approve ? "done" : "skipped", d: 350 });
      return;
    }
    ev.push({ k: "step", i, s: "done", d: 350 });
  });
  if (ev.at(-1)?.k !== "approval") ev.push({ k: "finish", d: 500 });
  return ev;
}

const initial = (): State => ({ cursor: 0, steps: fixtures.steps.map(() => "pending"), log: [], tokens: 0, rows: 0, words: 0, awaiting: null, finished: false, cancelled: false, decision: null });

function reducer(state: State, e: Event): State {
  if (e.type === "reset") return initial();
  if (e.type === "cancel") {
    return {
      ...state,
      finished: true,
      cancelled: true,
      awaiting: null,
      steps: state.steps.map((s) => (s === "running" || s === "waiting" || s === "failed" ? "skipped" : s)),
      log: state.log.map((x) => (x.kind === "tool" && x.status === "running" ? { ...x, status: "denied", result: "Cancelled" } : x.kind === "approval" && x.status === "waiting" ? { ...x, status: "denied" } : x)),
    };
  }
  if (e.type === "decide") {
    const aw = state.awaiting;
    if (!aw) return state;
    return {
      ...state,
      awaiting: null,
      decision: { approve: e.approve, count: e.count },
      steps: state.steps.map((s, i) => (i === aw.step ? "running" : s)),
      log: state.log.map((x) => (x.kind === "approval" && x.id === aw.id ? { ...x, status: e.approve ? "approved" : "denied", count: e.count } : x)),
    };
  }
  const { ev, at } = e;
  const next = { ...state, cursor: state.cursor + 1 };
  switch (ev.k) {
    case "step":
      next.steps = state.steps.map((s, i) => (i === ev.i ? ev.s : s));
      break;
    case "tool":
      next.log = [...state.log, { kind: "tool", id: ev.id, step: ev.step, call: ev.call, status: "running", retry: ev.retry, at }];
      break;
    case "toolFail":
      next.log = state.log.map((x) => (x.kind === "tool" && x.id === ev.id ? { ...x, status: "failed", result: ev.message, end: at } : x));
      break;
    case "toolDone": {
      const entry = state.log.find((x) => x.id === ev.id);
      next.log = state.log.map((x) => (x.kind === "tool" && x.id === ev.id ? { ...x, status: "done", result: (x.call as Call).result, end: at } : x));
      next.tokens = state.tokens + (entry?.kind === "tool" ? entry.call.tokens : 0);
      break;
    }
    case "denied":
      next.log = [...state.log, { kind: "tool", id: ev.id, step: ev.step, call: ev.call, status: "denied", result: "Denied by reviewer", at, end: at }];
      break;
    case "thought":
      next.log = [...state.log, { kind: "thought", id: ev.id, step: ev.step, text: ev.text, at }];
      next.tokens = state.tokens + 180;
      break;
    case "row":
      next.rows = state.rows + 1;
      break;
    case "words":
      next.words = state.words + ev.n;
      next.tokens = state.tokens + 14;
      break;
    case "approval":
      next.awaiting = { id: ev.id, step: ev.step };
      next.steps = state.steps.map((s, i) => (i === ev.step ? "waiting" : s));
      next.log = [...state.log, { kind: "approval", id: ev.id, step: ev.step, status: "waiting", count: 0, at }];
      break;
    case "finish":
      next.finished = true;
      break;
  }
  return next;
}

export function AiRunReplayShowcasePage() {
  const [state, dispatch] = useReducer(reducer, undefined, initial);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  const events = useMemo(() => buildEvents(state.decision), [state.decision]);
  const offsets = useMemo(() => {
    let sum = 0;
    return events.map((e) => {
      sum += e.d;
      return sum;
    });
  }, [events]);
  const total = useMemo(() => buildEvents({ approve: true, count: fixtures.accounts.length }).reduce((n, e) => n + e.d, 0), []);

  useEffect(() => {
    if (paused || state.awaiting || state.finished) return;
    const ev = events[state.cursor];
    if (!ev) return;
    const id = setTimeout(() => dispatch({ type: "ev", ev, at: offsets[state.cursor] ?? 0 }), ev.d / SPEED);
    return () => clearTimeout(id);
  }, [events, offsets, state.cursor, state.awaiting, state.finished, paused]);
  useEffect(() => {
    if (paused || state.finished) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [paused, state.finished]);
  const awaiting = Boolean(state.awaiting);
  useEffect(() => {
    setCountdown(awaiting ? AUTO_APPROVE : null);
  }, [awaiting]);
  useEffect(() => {
    if (countdown === null || paused) return;
    if (countdown <= 0) {
      dispatch({ type: "decide", approve: true, count: fixtures.accounts.length });
      return;
    }
    const id = setTimeout(() => setCountdown((c) => (c === null ? c : c - 1)), 1000);
    return () => clearTimeout(id);
  }, [countdown, paused]);

  const status: AgentRun["status"] = state.cancelled ? "cancelled" : state.finished ? "completed" : state.awaiting ? "waiting" : paused ? "paused" : "running";
  const approvalStep = state.awaiting ? fixtures.steps[state.awaiting.step]?.approval : undefined;
  const head = state.cursor > 0 ? (offsets[state.cursor - 1] ?? 0) : 0;
  const moving = status === "running" && state.cursor < events.length;
  const emailStep = fixtures.steps.findIndex((s) => s.approval);
  const run: AgentRun = {
    ...fixtures.run,
    status,
    elapsedMs: elapsed * 1000,
    headMs: head,
    totalMs: total,
    tokens: state.tokens,
    cost: (state.tokens / 1000) * 0.006,
    steps: fixtures.steps.map((s, i) => ({ title: s.title, status: state.steps[i] ?? "pending", approval: Boolean(s.approval) })),
    log: state.log,
    approval: state.awaiting && approvalStep ? { step: state.awaiting.step, title: approvalStep.title, description: approvalStep.description } : undefined,
  };
  const output: RunOutput = {
    title: fixtures.getRunOutput.title,
    accounts: state.rows >= ROWS ? fixtures.accounts : fixtures.accounts.slice(0, state.rows),
    email: state.words > 0 ? { ...fixtures.email, body: fixtures.email.body.split(" ").slice(0, state.words).join(" ") } : undefined,
    state: state.decision?.approve && state.steps[emailStep] === "done" ? "sent" : state.decision && !state.decision.approve ? "held" : state.words >= WORDS ? "ready" : "drafting",
  };

  return (
    <DevlFrame>
      <RunReplay
        autoApprove={countdown !== null ? { seconds: countdown, total: AUTO_APPROVE } : undefined}
        onCancel={async () => dispatch({ type: "cancel" })}
        onCopyLink={() => {}}
        onDecide={async ({ approve, recipients }) => dispatch({ type: "decide", approve, count: recipients.length })}
        onExportTrace={() => {}}
        onOpenDrafts={() => {}}
        onPausedChange={setPaused}
        onRecipientsChange={() => setCountdown(null)}
        onRerun={() => {
          dispatch({ type: "reset" });
          setElapsed(0);
          setPaused(false);
        }}
        output={output}
        run={run}
        traceNext={moving ? { at: offsets[state.cursor] ?? head, inMs: (events[state.cursor]?.d ?? 0) / SPEED } : undefined}
      />
    </DevlFrame>
  );
}
