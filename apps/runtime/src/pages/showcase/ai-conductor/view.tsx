// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `conductor`).
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import { ScrollRegion } from "@wirefront/ui/wirefront/scroll-region";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ArrowUpIcon, CheckIcon, CircleDashedIcon, FileTextIcon, HandIcon, LoaderCircleIcon, MegaphoneIcon, SendIcon, SparklesIcon, WorkflowIcon, XIcon } from "lucide-react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion, useReducedMotion } from "motion/react";
import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import type { BriefField, BriefValue, ConductorMessage, Helper, HelperTone } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("conductor.<key>"). */
export const CONDUCTOR_MESSAGES = {
  newPlan: "New plan",
  helpers: "Helpers",
  helpersCount: "{count} helpers",
  working: "{count} working",
  needsYouCount: "{count} needs you",
  allDone: "All {count} done",
  idle: "Idle",
  noneYet: "None yet",
  helpersEmpty: "Helpers show up here as work is handed out.",
  needsYou: "Needs you",
  done: "Done",
  queued: "Queued",
  finished: "Finished",
  filledBy: "Filled by {name}",
  filledByShort: ", filled by {name}",
  briefIntro: "{name} fills this in as you talk. Anything you edit stays yours.",
  filledCount: "{filled} of {total}",
  chipsPlaceholder: "Add and press Enter",
  empty: "Empty",
  remove: "Remove {value}",
  filledFields: "Filled {count} fields in {title}",
  filledOne: "Filled 1 field in {title}",
  asked: "Asked {name} to help with {role}",
  starting: "Starting a session…",
  selected: "{count} selected",
  anyNumber: "Any number",
  use: "Use {count}",
  useNone: "Use",
  pickLabel: "Options",
  messageLabel: "Message {name}",
  placeholder: "Reply to {name}…",
  answerPlaceholder: "Or type your answer…",
  send: "Send",
  waitingOnYou: "Waiting on you",
  helperWorking: "1 helper working",
  helpersWorking: "{count} helpers working",
  handedOffTo: "Handed off to {target}",
  complete: "Brief complete",
  listening: "Listening",
  handOff: "Hand off",
  handedOff: "Handed off",
  chat: "Chat",
  brief: "Brief",
  conversation: "Conversation",
  briefAndHelpers: "Brief and helpers",
  views: "Views",
};

export interface ConductorProps {
  /** The orchestrating agent's name. */
  agentName: string;
  /** The thread title, e.g. the project field. */
  title?: string;
  briefTitle: string;
  messages: ConductorMessage[];
  helpers: Helper[];
  fields: BriefField[];
  values: Record<string, BriefValue>;
  /** An icon per field key; a dashed circle is used otherwise. */
  fieldIcons?: Record<string, ReactNode>;
  /** True once the brief is finished and can be handed off. */
  complete?: boolean;
  /** Where the brief was handed off to; set after onHandOff succeeds. */
  handedOffTo?: string;
  /** Sends a message. It shows at once and is removed if this fails. */
  onSend: Action<{ text: string }>;
  /** Answers the latest question. The picker closes at once and reopens if this fails. */
  onAnswer?: Action<{ messageId: string; picks: string[] }>;
  /** Edits a brief field. Fields are read-only without it. */
  onFieldChange?: (key: string, value: string | string[]) => void;
  /** Hand the finished brief off. The button is hidden without it. */
  onHandOff?: Action;
  className?: string;
}

const tone: Record<HelperTone, { dot: string; soft: string; stroke: string }> = {
  orange: { dot: "bg-category-7", soft: "bg-category-7/14 text-category-7-foreground", stroke: "stroke-category-7" },
  teal: { dot: "bg-category-6", soft: "bg-category-6/14 text-category-6-foreground", stroke: "stroke-category-6" },
  violet: { dot: "bg-category-5", soft: "bg-category-5/16 text-category-5-foreground", stroke: "stroke-category-5" },
  rose: { dot: "bg-category-4", soft: "bg-category-4/14 text-category-4-foreground", stroke: "stroke-category-4" },
  info: { dot: "bg-info", soft: "bg-info/14 text-info-foreground", stroke: "stroke-info" },
};

const ease = [0.23, 1, 0.32, 1] as const;
type Messages = typeof CONDUCTOR_MESSAGES;

function AgentMark({ helper, size = "md" }: { helper: Helper; size?: "sm" | "md" }) {
  const reduce = useReducedMotion();
  const t = tone[helper.tone];
  const sm = size === "sm";
  return (
    <span aria-hidden className={cn("relative shrink-0", sm ? "size-6" : "size-8")}>
      {sm ? null : (
        <svg aria-hidden="true" className="absolute inset-0 size-8 -rotate-90" viewBox="0 0 32 32">
          <circle className="stroke-border" cx="16" cy="16" fill="none" r="15" strokeWidth="1.5" />
          <motion.circle
            animate={{ pathLength: helper.status === "queued" ? 0 : helper.progress / 100 }}
            className={cn("transition-colors duration-300", helper.status === "done" ? "stroke-success" : helper.status === "waiting" ? "stroke-warning" : t.stroke)}
            cx="16"
            cy="16"
            fill="none"
            initial={false}
            r="15"
            strokeLinecap="round"
            strokeWidth="1.5"
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 24 }}
          />
        </svg>
      )}
      <span className={cn("absolute flex items-center justify-center rounded-full font-semibold", sm ? "inset-0 text-[10px]" : "inset-[4px] text-[11px]", t.soft)}>{helper.name[0]}</span>
      <AnimatePresence>
        {!sm && helper.status === "done" ? (
          <motion.span animate={{ opacity: 1, scale: 1 }} className="absolute -end-0.5 -bottom-0.5 flex size-3.5 items-center justify-center rounded-full bg-success text-white ring-2 ring-background" initial={{ opacity: 0, scale: 0.6 }} transition={{ type: "spring", stiffness: 500, damping: 28 }}>
            <CheckIcon className="size-2.5" strokeWidth={3} />
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}

function statusLabel(h: Helper, t: Messages) {
  if (h.status === "done") return h.result ?? t.finished;
  if (h.status === "queued") return t.queued;
  return h.activity ?? "";
}

function HelperPanel({ helpers, t }: { helpers: Helper[]; t: Messages }) {
  const working = helpers.filter((h) => h.status === "working").length;
  const waiting = helpers.filter((h) => h.status === "waiting").length;
  const done = helpers.length > 0 && helpers.every((h) => h.status === "done");
  const summary = working ? interpolate(t.working, { count: working }) : waiting ? interpolate(t.needsYouCount, { count: waiting }) : done ? interpolate(t.allDone, { count: helpers.length }) : helpers.length ? t.idle : t.noneYet;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-11 shrink-0 items-center gap-2 px-4">
        <h2 className="font-medium">{t.helpers}</h2>
        <span aria-live="polite" className="ms-auto flex items-center gap-1.5 text-muted-foreground text-xs tabular-nums">
          <span aria-hidden className={cn("size-1.5 rounded-full transition-colors", working ? "animate-pulse bg-info motion-reduce:animate-none" : waiting ? "bg-warning" : done ? "bg-success" : "bg-muted-foreground/40")} />
          {summary}
        </span>
      </div>
      <ScrollRegion aria-label={t.helpers} className="min-h-0 flex-1">
        <div className="px-2 pb-3">
          {helpers.length === 0 ? (
            <div className="mx-2 mt-1 flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center text-muted-foreground text-xs">
              <CircleDashedIcon aria-hidden className="size-4" />
              {t.helpersEmpty}
            </div>
          ) : (
            <ul className="flex flex-col">
              <AnimatePresence initial={false}>
                {helpers.map((h) => (
                  <motion.li animate={{ opacity: 1, y: 0 }} className="flex gap-3 rounded-lg px-2 py-2.5" initial={{ opacity: 0, y: 6 }} key={h.id} layout="position" transition={{ duration: 0.24, ease }}>
                    <AgentMark helper={h} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-medium">{h.name}</span>
                        <span className="truncate text-muted-foreground text-xs">{h.role}</span>
                        <span className={cn("ms-auto shrink-0 text-xs tabular-nums", h.status === "waiting" ? "font-medium text-warning-foreground" : "text-muted-foreground")}>
                          {h.status === "waiting" ? t.needsYou : h.status === "done" ? t.done : h.status === "queued" ? "" : `${h.progress}%`}
                        </span>
                      </div>
                      <div className={cn("relative mt-0.5 h-4 overflow-hidden text-xs", h.status === "done" ? "text-foreground/80" : "text-muted-foreground")}>
                        <AnimatePresence initial={false} mode="popLayout">
                          <motion.span animate={{ y: 0, opacity: 1 }} className="block truncate" exit={{ y: -10, opacity: 0 }} initial={{ y: 10, opacity: 0 }} key={statusLabel(h, t)} transition={{ duration: 0.22, ease }}>
                            {statusLabel(h, t)}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </ScrollRegion>
    </div>
  );
}

/** A brief highlight when the agent writes a new value; nothing on first render. */
function Flash({ value }: { value?: string }) {
  const mounted = useRef(value);
  return (
    <AnimatePresence>
      {value !== undefined && value !== mounted.current ? (
        <motion.span animate={{ opacity: 0 }} aria-hidden className="pointer-events-none absolute inset-0 rounded-md bg-info/14" initial={{ opacity: 1 }} key={value} transition={{ duration: 1.4, ease: "easeOut" }} />
      ) : null}
    </AnimatePresence>
  );
}

function ChipsField({ id, value, onChange, placeholder, removeLabel }: { id: string; value: string[]; onChange?: (v: string[]) => void; placeholder: string; removeLabel: string }) {
  const [draft, setDraft] = useState("");
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!onChange) return;
    const next = draft.trim();
    if (e.key === "Enter" && next) {
      e.preventDefault();
      if (!value.includes(next)) onChange([...value, next]);
      setDraft("");
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };
  return (
    <div className="flex min-h-8 flex-wrap items-center gap-1 rounded-md px-1.5 py-1 transition-colors focus-within:bg-accent/60 hover:bg-accent/50">
      <AnimatePresence initial={false} mode="popLayout">
        {value.map((v) => (
          <motion.span animate={{ opacity: 1, scale: 1 }} className="inline-flex h-6 items-center gap-0.5 rounded-md border bg-background ps-2 pe-0.5 text-xs shadow-xs/5 dark:bg-input/40" exit={{ opacity: 0, scale: 0.9 }} initial={{ opacity: 0, scale: 0.9 }} key={v} layout transition={{ type: "spring", stiffness: 500, damping: 34 }}>
            {v}
            {onChange ? (
              <button aria-label={interpolate(removeLabel, { value: v })} className="relative flex size-4 cursor-pointer items-center justify-center rounded text-muted-foreground outline-none after:absolute after:-inset-1.5 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={() => onChange(value.filter((x) => x !== v))} type="button">
                <XIcon aria-hidden className="size-3" />
              </button>
            ) : null}
          </motion.span>
        ))}
      </AnimatePresence>
      <input className="h-6 min-w-12 flex-1 bg-transparent px-0.5 text-base outline-none placeholder:text-muted-foreground/56 sm:text-sm" id={id} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown} placeholder={value.length ? "" : placeholder} readOnly={!onChange} value={draft} />
    </div>
  );
}

function BriefDoc({ title, fields, values, icons, onEdit, agentName, t }: { title: string; fields: BriefField[]; values: Record<string, BriefValue>; icons: Record<string, ReactNode>; onEdit?: (key: string, value: string | string[]) => void; agentName: string; t: Messages }) {
  const id = useId();
  const filled = fields.filter((f) => {
    const v = values[f.key]?.value;
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  }).length;
  const pct = fields.length ? filled / fields.length : 0;
  const head = fields.find((f) => f.kind === "text");
  const props = fields.filter((f) => f !== head && f.kind !== "textarea");
  const sections = fields.filter((f) => f.kind === "textarea");
  const text = (key: string) => {
    const v = values[key]?.value;
    return typeof v === "string" ? v : "";
  };
  const agentFlash = (key: string) => (values[key]?.by === "agent" ? String(values[key]?.value) : undefined);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-11 shrink-0 items-center gap-2 px-5">
        <FileTextIcon aria-hidden className="size-4 text-muted-foreground" />
        <h2 className="min-w-0 flex-1 truncate font-medium">{title}</h2>
        <span className="text-muted-foreground text-xs tabular-nums">{interpolate(t.filledCount, { filled, total: fields.length })}</span>
        <span aria-hidden className="h-1 w-12 overflow-hidden rounded-full bg-muted">
          <motion.span animate={{ scaleX: pct }} className={cn("block h-full origin-left rounded-full transition-colors duration-300 rtl:origin-right", pct === 1 ? "bg-success" : "bg-primary")} initial={false} transition={{ type: "spring", stiffness: 160, damping: 26 }} />
        </span>
      </div>
      <ScrollRegion aria-label={title} className="min-h-0 flex-1">
        <form className="px-5 pt-3 pb-6" onSubmit={(e) => e.preventDefault()}>
          {head ? (
            <div className="relative -mx-2">
              <label className="sr-only" htmlFor={`${id}-${head.key}`}>
                {head.label}
              </label>
              <input className="h-10 w-full rounded-md bg-transparent px-2 font-semibold text-xl tracking-tight outline-none transition-colors placeholder:text-muted-foreground/56 hover:bg-accent/50 focus-visible:bg-accent/60" id={`${id}-${head.key}`} onChange={(e) => onEdit?.(head.key, e.target.value)} placeholder={head.placeholder} readOnly={!onEdit} value={text(head.key)} />
              <Flash value={agentFlash(head.key)} />
            </div>
          ) : null}
          <p className="mt-1 text-pretty text-muted-foreground text-xs">{interpolate(t.briefIntro, { name: agentName })}</p>

          <dl className="mt-5 flex flex-col gap-0.5">
            {props.map((f) => {
              const s = values[f.key];
              const fid = `${id}-${f.key}`;
              const byAgent = s?.by === "agent";
              return (
                <div className="grid min-h-8 grid-cols-[6.25rem_minmax(0,1fr)] items-start gap-1.5 @md:grid-cols-[7rem_minmax(0,1fr)]" key={f.key}>
                  <dt className="flex h-8 items-center gap-2 text-muted-foreground">
                    <span aria-hidden className={cn("shrink-0 transition-colors duration-300 [&_svg]:size-3.5", byAgent && "text-info")}>
                      {icons[f.key] ?? <CircleDashedIcon />}
                    </span>
                    <label className="truncate" htmlFor={fid}>
                      {f.label}
                    </label>
                    {byAgent ? <span className="sr-only">{interpolate(t.filledByShort, { name: agentName })}</span> : null}
                  </dt>
                  <dd className="relative">
                    {f.kind === "chips" ? (
                      <ChipsField id={fid} onChange={onEdit ? (v) => onEdit(f.key, v) : undefined} placeholder={f.placeholder ?? t.chipsPlaceholder} removeLabel={t.remove} value={Array.isArray(s?.value) ? s.value : []} />
                    ) : (
                      <div className="flex h-8 items-center gap-2 rounded-md px-2 transition-colors focus-within:bg-accent/60 hover:bg-accent/50">
                        <input className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/56" id={fid} onChange={(e) => onEdit?.(f.key, e.target.value)} placeholder={f.placeholder ?? t.empty} readOnly={!onEdit} value={text(f.key)} />
                      </div>
                    )}
                    <Flash value={agentFlash(f.key)} />
                  </dd>
                </div>
              );
            })}
          </dl>

          {sections.map((f) => {
            const fid = `${id}-${f.key}`;
            return (
              <div className="mt-5 border-t pt-4" key={f.key}>
                <div className="flex items-center gap-2">
                  <label className="font-medium text-xs" htmlFor={fid}>
                    {f.label}
                  </label>
                  {values[f.key]?.by === "agent" ? (
                    <span className="ms-auto inline-flex shrink-0 items-center text-info" title={interpolate(t.filledBy, { name: agentName })}>
                      <SparklesIcon aria-hidden className="size-3" />
                      <span className="sr-only">{interpolate(t.filledBy, { name: agentName })}</span>
                    </span>
                  ) : null}
                </div>
                <div className="relative -mx-2 mt-1">
                  <textarea className="field-sizing-content min-h-16 w-full resize-none rounded-md bg-transparent px-2 py-1.5 leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/56 hover:bg-accent/50 focus-visible:bg-accent/60" id={fid} onChange={(e) => onEdit?.(f.key, e.target.value)} placeholder={f.placeholder} readOnly={!onEdit} value={text(f.key)} />
                  <Flash value={agentFlash(f.key)} />
                </div>
              </div>
            );
          })}
        </form>
      </ScrollRegion>
    </div>
  );
}

function ActivityRows({ msg, helpers, briefTitle, onOpen, t }: { msg: ConductorMessage; helpers: Helper[]; briefTitle: string; onOpen: (pane: "brief" | "agents") => void; t: Messages }) {
  const rows: { key: string; pane: "brief" | "agents"; icon: ReactNode; label: string; meta: ReactNode }[] = [];
  if (msg.updated) {
    rows.push({ key: "brief", pane: "brief", icon: <FileTextIcon className="size-3.5 text-muted-foreground" />, label: interpolate(msg.updated === 1 ? t.filledOne : t.filledFields, { count: msg.updated, title: briefTitle }), meta: <SparklesIcon aria-hidden className="size-3 text-info" /> });
  }
  for (const sid of msg.spawned ?? []) {
    const h = helpers.find((x) => x.id === sid);
    if (!h) continue;
    rows.push({
      key: sid,
      pane: "agents",
      icon: <AgentMark helper={h} size="sm" />,
      label: interpolate(t.asked, { name: h.name, role: h.role.toLowerCase() }),
      meta:
        h.status === "done" ? (
          <span className="inline-flex items-center gap-1 text-success-foreground">
            <CheckIcon aria-hidden className="size-3" />
            {t.done}
          </span>
        ) : h.status === "waiting" ? (
          <span className="inline-flex items-center gap-1 text-warning-foreground">
            <HandIcon aria-hidden className="size-3" />
            {t.needsYou}
          </span>
        ) : h.status === "working" ? (
          <span className="inline-flex items-center gap-1 tabular-nums">
            <LoaderCircleIcon aria-hidden className="size-3 animate-spin motion-reduce:animate-none" />
            {h.progress}%
          </span>
        ) : (
          t.queued
        ),
    });
  }
  if (!rows.length) return null;
  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-xl border bg-card shadow-xs/5" initial={{ opacity: 0, y: 4 }} transition={{ duration: 0.22, ease }}>
      {rows.map((r) => (
        <button className="flex h-9 w-full cursor-pointer items-center gap-2.5 border-b px-3 text-start text-muted-foreground text-xs outline-none transition-colors last:border-b-0 hover:bg-accent/50 focus-visible:bg-accent/60" key={r.key} onClick={() => onOpen(r.pane)} type="button">
          <span aria-hidden className="flex size-6 shrink-0 items-center justify-center">
            {r.icon}
          </span>
          <span className="min-w-0 flex-1 truncate">{r.label}</span>
          <span className="shrink-0 text-muted-foreground">{r.meta}</span>
        </button>
      ))}
    </motion.div>
  );
}

function ConductorScreen({ agentName, title, briefTitle, messages, helpers, fields, values, fieldIcons = {}, complete = false, handedOffTo, onSend, onAnswer, onFieldChange, onHandOff, className }: ConductorProps) {
  const t = useMessages("conductor", CONDUCTOR_MESSAGES);
  const [picks, setPicks] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<"narrow" | "mid" | "wide">("wide");
  const [pane, setPane] = useState<"chat" | "brief" | "agents">("chat");
  const [side, setSide] = useState<"brief" | "agents">("brief");
  const rootRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const group = useId();
  const seq = useRef(0);

  // Sent messages and answers show until the messages prop changes (the backend echoed them).
  const [localState, setLocalState] = useState<{ for: ConductorMessage[]; sent: ConductorMessage[] }>({ for: messages, sent: [] });
  const sent = localState.for === messages ? localState.sent : [];
  const setSent = (fn: (sent: ConductorMessage[]) => ConductorMessage[]) => setLocalState((l) => ({ for: messages, sent: fn(l.for === messages ? l.sent : []) }));
  const shown = [...messages, ...sent];
  const addLocal = (text: string) => {
    const id = `${group}-sent-${++seq.current}`;
    setSent((l) => [...l, { id, role: "user", text }]);
    return () => setSent((l) => l.filter((m) => m.id !== id));
  };

  const send = useAction(onSend, { optimistic: ({ text }) => addLocal(text) });
  const answer = useAction(onAnswer ?? (async () => {}), { optimistic: ({ picks: chosen }) => addLocal(chosen.join(", ")) });
  const handOff = useAction(onHandOff ?? (async () => {}));
  const error = send.error ?? answer.error ?? handOff.error;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = e?.contentRect.width ?? 0;
      setMode(w < 768 ? "narrow" : w < 1100 ? "mid" : "wide");
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The picker shows while the latest message is the agent's question; any reply closes it.
  const last = shown.at(-1);
  const question = last?.role === "agent" && last.choices && !last.streaming && onAnswer ? { id: last.id, ...last.choices } : undefined;

  // Follow the conversation as it grows (new messages, streamed text) or the viewport shrinks
  // (the answer picker opening). The ScrollRegion viewport is the content's direct parent.
  const reduceRef = useRef(reduce);
  reduceRef.current = reduce;
  useEffect(() => {
    const content = chatRef.current;
    const viewport = content?.parentElement;
    if (!content || !viewport) return;
    const ro = new ResizeObserver(() => viewport.scrollTo?.({ top: viewport.scrollHeight, behavior: reduceRef.current ? "auto" : "smooth" }));
    ro.observe(content);
    ro.observe(viewport);
    return () => ro.disconnect();
  }, []);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    if (question) {
      const chosen = text
        .split(/,|\band\b/)
        .map((x) => x.trim())
        .filter(Boolean);
      answer.run({ messageId: question.id, picks: chosen });
      setPicks([]);
    } else send.run({ text });
    setDraft("");
  };
  const sendPicks = () => {
    if (!question || !picks.length) return;
    answer.run({ messageId: question.id, picks });
    setPicks([]);
  };

  const working = helpers.filter((h) => h.status === "working").length;
  const needsYou = helpers.some((h) => h.status === "waiting");
  const status = needsYou
    ? { dot: "bg-warning", text: t.waitingOnYou }
    : working
      ? { dot: "bg-info animate-pulse motion-reduce:animate-none", text: working === 1 ? t.helperWorking : interpolate(t.helpersWorking, { count: working }) }
      : complete
        ? { dot: "bg-success", text: handedOffTo ? interpolate(t.handedOffTo, { target: handedOffTo }) : t.complete }
        : { dot: "bg-muted-foreground/40", text: t.listening };
  const openPane = (p: "brief" | "agents") => (mode === "narrow" ? setPane(p) : mode === "mid" ? setSide(p) : undefined);

  const chat = (
    <div className="flex h-full min-h-0 flex-col">
      <ScrollRegion aria-label={t.conversation} className="min-h-0 flex-1">
        <div className="mx-auto flex max-w-[40rem] flex-col gap-6 px-4 py-6 @3xl:px-8" ref={chatRef}>
          {shown.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
              <LoaderCircleIcon aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
              {t.starting}
            </div>
          ) : null}
          <AnimatePresence initial={false}>
            {shown.map((m) => (
              <motion.div animate={{ opacity: 1, y: 0 }} className={cn("flex", m.role === "user" ? "justify-end" : "gap-3")} initial={{ opacity: 0, y: 6 }} key={m.id} transition={{ duration: 0.26, ease }}>
                {m.role === "agent" ? (
                  <span aria-hidden className="mt-px flex size-6 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
                    <WorkflowIcon className="size-3.5" />
                  </span>
                ) : null}
                {m.role === "user" ? (
                  <div className="max-w-[85%] rounded-2xl bg-muted px-3.5 py-2 leading-relaxed">{m.text}</div>
                ) : (
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <p className="text-pretty leading-relaxed">
                      {m.text}
                      {m.streaming ? <span aria-hidden className="ms-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-foreground/50 motion-reduce:animate-none" /> : null}
                    </p>
                    {m.streaming ? null : <ActivityRows briefTitle={briefTitle} helpers={helpers} msg={m} onOpen={openPane} t={t} />}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollRegion>

      <div className="px-4 pb-4 @3xl:px-8">
        <div className="mx-auto max-w-[40rem]">
          {error ? (
            <p className="mb-2 text-destructive text-xs" role="alert">
              {error}
            </p>
          ) : null}
          <div className="rounded-2xl border bg-card shadow-xs/5 transition-shadow focus-within:border-ring/64 focus-within:ring-[3px] focus-within:ring-ring/16">
            <AnimatePresence initial={false}>
              {question ? (
                <motion.div animate={{ opacity: 1, height: "auto" }} className="overflow-hidden" exit={{ opacity: 0, height: 0 }} initial={{ opacity: 0, height: 0 }} transition={{ duration: 0.24, ease }}>
                  <fieldset className="m-0 min-w-0 border-0 border-b p-3">
                    <legend className="contents">
                      <span className="mb-2 flex items-center gap-2 text-muted-foreground text-xs">
                        <MegaphoneIcon aria-hidden className="size-3.5" />
                        {question.prompt}
                        <span className="ms-auto tabular-nums">{picks.length ? interpolate(t.selected, { count: picks.length }) : t.anyNumber}</span>
                      </span>
                    </legend>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {question.options.map((c) => {
                        const on = picks.includes(c);
                        return (
                          <button aria-pressed={on} className={cn("inline-flex h-7 cursor-pointer items-center gap-1 rounded-full border px-2.5 text-xs outline-none transition-[background-color,color,border-color,scale] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]", on ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-accent dark:bg-input/32")} key={c} onClick={() => setPicks((p) => (on ? p.filter((x) => x !== c) : [...p, c]))} type="button">
                            {on ? <CheckIcon aria-hidden className="size-3" /> : null}
                            {c}
                          </button>
                        );
                      })}
                      <Button className="ms-auto" disabled={!picks.length} onClick={sendPicks} size="xs">
                        {picks.length ? interpolate(t.use, { count: picks.length }) : t.useNone}
                      </Button>
                    </div>
                  </fieldset>
                </motion.div>
              ) : null}
            </AnimatePresence>
            <form
              className="flex items-end gap-2 p-2"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <label className="sr-only" htmlFor={`${group}-msg`}>
                {interpolate(t.messageLabel, { name: agentName })}
              </label>
              <textarea
                className="field-sizing-content max-h-28 min-h-8 flex-1 resize-none bg-transparent px-2 py-1.5 text-base outline-none placeholder:text-muted-foreground/72 sm:text-sm"
                id={`${group}-msg`}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder={question ? t.answerPlaceholder : interpolate(t.placeholder, { name: agentName })}
                rows={1}
                value={draft}
              />
              <Button aria-label={t.send} className="rounded-full" disabled={!draft.trim()} size="icon-sm" type="submit">
                <ArrowUpIcon />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  const brief = <BriefDoc agentName={agentName} fields={fields} icons={fieldIcons} onEdit={onFieldChange} t={t} title={briefTitle} values={values} />;
  const panel = <HelperPanel helpers={helpers} t={t} />;
  const badge = needsYou || working > 0;

  const segmented = (options: { id: string; label: string; badge?: boolean }[], value: string, onChange: (v: string) => void, layoutKey: string) => (
    <LayoutGroup id={`${group}-${layoutKey}`}>
      <fieldset className="m-0 flex min-w-0 rounded-lg border-0 bg-muted p-0.5">
        <legend className="sr-only">{t.views}</legend>
        {options.map((o) => (
          <button aria-pressed={value === o.id} className={cn("relative flex h-7 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 font-medium text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring", value === o.id ? "text-foreground" : "text-muted-foreground hover:text-foreground")} key={o.id} onClick={() => onChange(o.id)} type="button">
            {value === o.id ? <motion.span className="absolute inset-0 rounded-md bg-background shadow-xs/5 dark:bg-input" layoutId="seg" transition={{ type: "spring", stiffness: 500, damping: 38 }} /> : null}
            <span className="relative">{o.label}</span>
            {o.badge ? <span aria-hidden className="relative size-1.5 rounded-full bg-warning" /> : null}
          </button>
        ))}
      </fieldset>
    </LayoutGroup>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("@container relative flex h-svh w-full flex-col overflow-hidden bg-background text-foreground text-sm", className)} ref={rootRef}>
        <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span aria-hidden className="flex size-6 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
              <WorkflowIcon className="size-3.5" />
            </span>
            <span className="hidden shrink-0 text-muted-foreground @md:inline">{agentName}</span>
            <span aria-hidden className="hidden text-muted-foreground/48 @md:inline">
              /
            </span>
            <h1 className="truncate font-medium">{title || t.newPlan}</h1>
            <span aria-live="polite" className="ms-1 hidden shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-muted-foreground text-xs @lg:inline-flex">
              <span aria-hidden className={cn("size-1.5 rounded-full", status.dot)} />
              {status.text}
            </span>
          </div>
          {helpers.length > 0 ? (
            <button className="hidden cursor-pointer items-center -space-x-1.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring @md:flex" onClick={() => openPane("agents")} type="button">
              <span className="sr-only">{interpolate(t.helpersCount, { count: helpers.length })}</span>
              <AnimatePresence initial={false}>
                {helpers.map((h) => (
                  <motion.span animate={{ opacity: 1, scale: 1 }} className="flex rounded-full ring-2 ring-background" initial={{ opacity: 0, scale: 0.9 }} key={h.id} transition={{ duration: 0.2, ease }}>
                    <AgentMark helper={h} size="sm" />
                  </motion.span>
                ))}
              </AnimatePresence>
            </button>
          ) : null}
          <AnimatePresence initial={false}>
            {complete && onHandOff ? (
              <motion.div animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} initial={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2, ease }}>
                <Button disabled={Boolean(handedOffTo) || handOff.isPending()} onClick={() => handOff.run()} size="sm" variant={handedOffTo ? "outline" : "default"}>
                  {handedOffTo ? <CheckIcon /> : <SendIcon />}
                  {handedOffTo ? t.handedOff : t.handOff}
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </header>

        {mode === "narrow" ? (
          <div className="border-b px-4 py-2">
            {segmented(
              [
                { id: "chat", label: t.chat },
                { id: "brief", label: t.brief },
                { id: "agents", label: t.helpers, badge },
              ],
              pane,
              (v) => setPane(v as typeof pane),
              "pane",
            )}
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1">
          {mode !== "narrow" || pane === "chat" ? (
            <section aria-label={t.conversation} className="min-w-0 flex-1">
              {chat}
            </section>
          ) : null}

          {mode === "wide" ? (
            <>
              <section aria-label={t.helpers} className="w-60 shrink-0 border-s bg-muted/32 dark:bg-muted/16">
                {panel}
              </section>
              <section aria-label={t.brief} className="w-[25rem] shrink-0 border-s">
                {brief}
              </section>
            </>
          ) : null}

          {mode === "mid" ? (
            <section aria-label={t.briefAndHelpers} className="flex w-[22rem] shrink-0 flex-col border-s">
              <div className="px-4 pt-3">
                {segmented(
                  [
                    { id: "brief", label: t.brief },
                    { id: "agents", label: t.helpers, badge },
                  ],
                  side,
                  (v) => setSide(v as typeof side),
                  "side",
                )}
              </div>
              <div className="min-h-0 flex-1">{side === "brief" ? brief : panel}</div>
            </section>
          ) : null}

          {mode === "narrow" && pane === "brief" ? <section className="min-w-0 flex-1">{brief}</section> : null}
          {mode === "narrow" && pane === "agents" ? <section className="min-w-0 flex-1">{panel}</section> : null}
        </div>
      </div>
    </MotionConfig>
  );
}

export function Conductor(props: ConductorProps) {
  return (
    <ScreenBoundary name="Conductor">
      <ConductorScreen {...props} />
    </ScreenBoundary>
  );
}
