// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: plays a scripted session in devl.dev's frame. The agent's replies and brief
// values type out, helpers make progress on a timer, and picking channels finishes the brief.
// Not shipped by the registry; builders stream sessions from their own agent backend.
import { CalendarIcon, GaugeIcon, MegaphoneIcon, MessageSquareQuoteIcon, UsersIcon, WalletIcon } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useReducer } from "react";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import type { BriefValue, ConductorMessage, Helper } from "./schema";
import { Conductor } from "./view";

const icons = { date: <CalendarIcon />, audience: <UsersIcon />, budget: <WalletIcon />, metric: <GaugeIcon />, tone: <MessageSquareQuoteIcon />, channels: <MegaphoneIcon /> };

type Msg = Omit<ConductorMessage, "streaming"> & { shown: number };
type Value = BriefValue & { target?: string };
interface HelperState {
  status: Helper["status"];
  progress: number;
  step: number;
  spawned: boolean;
}
interface State {
  msgs: Msg[];
  values: Record<string, Value>;
  helpers: Record<string, HelperState>;
  cue: number;
  finishing: number;
  seq: number;
  done: boolean;
  handedOff: boolean;
}
type Event = { type: "cue"; cue: fixtures.Cue; finishing?: boolean } | { type: "tick" } | { type: "type" } | { type: "edit"; key: string; value: string | string[] } | { type: "say"; text: string } | { type: "answer"; picks: string[] } | { type: "handoff" };

const initial = (): State => ({
  msgs: [],
  values: {},
  helpers: Object.fromEntries(fixtures.helpers.map((h) => [h.id, { status: "queued" as const, progress: 0, step: 0, spawned: false }])),
  cue: 0,
  finishing: -1,
  seq: 0,
  done: false,
  handedOff: false,
});

function apply(state: State, cue: fixtures.Cue): State {
  const seq = state.seq + 1;
  const id = `m${seq}`;
  if ("user" in cue) return { ...state, seq, msgs: [...state.msgs, { id, role: "user", text: cue.user, shown: cue.user.length }] };
  if ("agent" in cue) {
    const helpers = { ...state.helpers };
    for (const h of cue.spawned ?? []) if (helpers[h]) helpers[h] = { ...helpers[h], spawned: true };
    return { ...state, seq, helpers, msgs: [...state.msgs, { id, role: "agent", text: cue.agent, shown: 0, spawned: cue.spawned, updated: cue.updated, choices: cue.choices }] };
  }
  if ("fill" in cue) {
    const values = { ...state.values };
    for (const [k, v] of Object.entries(cue.fill)) values[k] = Array.isArray(v) ? { value: v, by: "agent" } : { value: "", target: v, by: "agent" };
    return { ...state, seq, values };
  }
  const helpers = { ...state.helpers };
  for (const h of cue.start) {
    const s = helpers[h];
    if (s) helpers[h] = { ...s, status: "working" };
  }
  return { ...state, helpers };
}

function reducer(state: State, e: Event): State {
  switch (e.type) {
    case "cue":
      return e.finishing ? { ...apply(state, e.cue), finishing: state.finishing + 1 } : { ...apply(state, e.cue), cue: state.cue + 1 };
    case "type": {
      let changed = false;
      const msgs = state.msgs.map((m) => {
        if (m.shown >= m.text.length) return m;
        changed = true;
        return { ...m, shown: Math.min(m.text.length, m.shown + 3) };
      });
      const values = { ...state.values };
      for (const [k, f] of Object.entries(values)) {
        if (f.target && typeof f.value === "string" && f.value.length < f.target.length) {
          changed = true;
          values[k] = { ...f, value: f.target.slice(0, f.value.length + 2) };
        }
      }
      return changed ? { ...state, msgs, values } : state;
    }
    case "tick": {
      let changed = false;
      const helpers = { ...state.helpers };
      for (const h of fixtures.helpers) {
        const s = helpers[h.id];
        if (s?.status !== "working") continue;
        changed = true;
        const progress = Math.min(100, s.progress + 3 + ((s.progress * 7 + h.id.length) % 5));
        const step = Math.min(h.steps.length - 1, Math.floor((progress / 100) * h.steps.length));
        const channels = state.values.channels?.value;
        if (h.id === "quill" && !(Array.isArray(channels) && channels.length > 0) && progress >= 78) helpers[h.id] = { ...s, status: "waiting", progress: 78, step: h.steps.length - 1 };
        else helpers[h.id] = { ...s, status: progress >= 100 ? "done" : "working", progress, step };
      }
      return changed ? { ...state, helpers } : state;
    }
    case "edit":
      return { ...state, values: { ...state.values, [e.key]: { value: e.value, by: "you" } } };
    case "say":
      return {
        ...state,
        seq: state.seq + 2,
        msgs: [...state.msgs, { id: `m${state.seq + 1}`, role: "user", text: e.text, shown: e.text.length }, { id: `m${state.seq + 2}`, role: "agent", text: fixtures.acknowledgement, shown: 0 }],
      };
    case "answer": {
      const helpers = { ...state.helpers };
      if (helpers.quill?.status === "waiting") helpers.quill = { ...helpers.quill, status: "working" };
      const text = e.picks.join(", ");
      const seq = state.seq + 1;
      return { ...state, seq, done: true, finishing: 0, helpers, msgs: [...state.msgs, { id: `m${seq}`, role: "user", text, shown: text.length }], values: { ...state.values, channels: { value: e.picks, by: "agent" } } };
    }
    case "handoff":
      return { ...state, handedOff: true };
  }
}

export function AiConductorShowcasePage() {
  const reduce = useReducedMotion();
  const [state, dispatch] = useReducer(reducer, undefined, initial);

  useEffect(() => {
    const cue = fixtures.script[state.cue];
    if (!cue) return;
    const id = setTimeout(() => dispatch({ type: "cue", cue }), reduce ? 150 : cue.wait);
    return () => clearTimeout(id);
  }, [state.cue, reduce]);
  useEffect(() => {
    const cue = fixtures.finish[state.finishing];
    if (!cue) return;
    const id = setTimeout(() => dispatch({ type: "cue", cue, finishing: true }), cue.wait);
    return () => clearTimeout(id);
  }, [state.finishing]);
  const typing = state.msgs.some((m) => m.shown < m.text.length) || Object.values(state.values).some((f) => f.target && typeof f.value === "string" && f.value.length < f.target.length);
  useEffect(() => {
    if (!typing) return;
    const id = setInterval(() => dispatch({ type: "type" }), reduce ? 5 : 28);
    return () => clearInterval(id);
  }, [typing, reduce]);
  const working = Object.values(state.helpers).some((h) => h.status === "working");
  useEffect(() => {
    if (!working) return;
    const id = setInterval(() => dispatch({ type: "tick" }), 420);
    return () => clearInterval(id);
  }, [working]);

  const messages: ConductorMessage[] = state.msgs.map(({ shown, ...m }) => ({ ...m, text: m.text.slice(0, shown), streaming: shown < m.text.length }));
  const helpers: Helper[] = fixtures.helpers
    .filter((h) => state.helpers[h.id]?.spawned)
    .map(({ steps, ...h }) => {
      const s = state.helpers[h.id] ?? { status: "queued" as const, progress: 0, step: 0 };
      return { ...h, status: s.status, progress: s.progress, activity: steps[s.step] };
    });
  const allDone = state.done && !working && helpers.every((h) => h.status === "done" || h.status === "queued");
  const project = state.values.project;

  return (
    <DevlFrame>
      <Conductor
        agentName="Conductor"
        briefTitle="Launch brief"
        complete={allDone}
        fieldIcons={icons}
        fields={fixtures.fields}
        handedOffTo={state.handedOff ? fixtures.handOffTarget : undefined}
        helpers={helpers}
        messages={messages}
        onAnswer={async ({ picks }) => dispatch({ type: "answer", picks })}
        onFieldChange={(key, value) => dispatch({ type: "edit", key, value })}
        onHandOff={async () => dispatch({ type: "handoff" })}
        onSend={async ({ text }) => dispatch({ type: "say", text })}
        title={project?.target ?? (typeof project?.value === "string" ? project.value : undefined)}
        values={state.values}
      />
    </DevlFrame>
  );
}
