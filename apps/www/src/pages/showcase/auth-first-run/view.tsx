// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Badge } from "@wirefront/ui/badge";
import { Button, buttonVariants } from "@wirefront/ui/button";
import { Input } from "@wirefront/ui/input";
import { cn } from "@wirefront/ui/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@wirefront/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@wirefront/ui/select";
import { Spinner } from "@wirefront/ui/spinner";
import { Textarea } from "@wirefront/ui/textarea";
import { useAction } from "@wirefront/ui/wirefront/action";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BotIcon,
  CalendarCheckIcon,
  CheckIcon,
  FlameIcon,
  LifeBuoyIcon,
  type LucideIcon,
  PlugIcon,
  PlusIcon,
  SparklesIcon,
  UserPlusIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type KeyboardEvent, type ReactNode, useEffect, useId, useState } from "react";

import { type AgentInput, type FirstRunTone, type InviteRole, type InviteStepInput, slugify, type WorkspaceColor, type WorkspaceStepInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("firstRun.<key>"). */
export const FIRST_RUN_MESSAGES = {
  setUp: "Set up your workspace",
  takesMinutes: "Takes about three minutes.",
  setUpCrumb: "/ Set up",
  stepOf: "Step {n} of {total}",
  allDone: "All done",
  progress: "Your progress",
  ofTotal: "of {total}",
  checkName: "Name your workspace",
  checkNamePending: "Pick a name and URL",
  checkTools: "Connect a tool",
  checkToolsMore: "{names} and more",
  skipped: "Skipped for now",
  checkTeam: "Invite a teammate",
  checkTeamSentOne: "1 invite sent",
  checkTeamSent: "{count} invites sent",
  checkTeamPending: "Work is better together",
  checkAgent: "Create your first agent",
  checkAgentLive: "{name} is live",
  checkAgentPending: "Start from a template",
  workspaceTitle: "Name your workspace",
  workspaceSub: "This is where your agents and your team will live.",
  colour: "Workspace colour",
  orange: "Orange",
  teal: "Teal",
  violet: "Violet",
  amber: "Amber",
  info: "Blue",
  rose: "Rose",
  workspaceName: "Workspace name",
  workspaceNamePlaceholder: "Acme Inc.",
  nameHint: "Teammates see this in invites and emails.",
  nameMissing: "Give your workspace a name to continue.",
  workspaceUrl: "Workspace URL",
  taken: "Taken",
  available: "Available",
  checking: "Checking",
  slugMissing: "Pick a URL for your workspace.",
  slugTaken: "{url} is taken. Try another.",
  slugChecking: "Checking the URL…",
  slugEdited: "Lowercase letters, numbers and dashes.",
  slugFromName: "Filled in from the name. Edit it if you like.",
  useFor: "What will you use {product} for?",
  toolsTitle: "Connect your tools",
  toolsSub: "Agents can read and act in the tools you connect. You can change this later.",
  connect: "Connect",
  connecting: "Connecting",
  connected: "Connected",
  connectLabel: "Connect {name}",
  connectedLabel: "Connected, disconnect {name}",
  connectingLabel: "Connecting {name}",
  toolsCount: "of {total} connected · read-only until you grant more",
  teamTitle: "Invite your team",
  teamSub: "Invite people now or later. They’ll get an email with a link.",
  emails: "Email addresses",
  addAnother: "Add another",
  emailPlaceholder: "name@company.com",
  role: "Role",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
  invite: "Invite",
  notEmail: "“{value}” doesn’t look like an email",
  emailHint: "Press Enter or comma to add each address.",
  removeEmail: "Remove {email}",
  suggested: "Suggested from your domain",
  pendingInvites: "Pending invites",
  noInvites: "No invites yet. You can always do this later.",
  invitePending: "Invite sent · pending",
  cancelInvite: "Cancel invite for {email}",
  agentTitle: "Create your first agent",
  agentSub: "Pick a starting point. You can tune everything after.",
  template: "Template",
  agentName: "Agent name",
  agentNameHint: "Shown when it posts or replies. You can rename it later.",
  agentNameMissing: "Your agent needs a name.",
  defaultAgentName: "My agent",
  instructions: "Instructions",
  instructionsPlaceholder: "Describe what this agent should do, in plain words.",
  preview: "Preview",
  untitled: "Untitled agent",
  inWorkspace: "in {name}",
  yourWorkspace: "your workspace",
  draft: "Draft",
  noInstructions: "No instructions yet.",
  noTools: "No tools connected yet",
  back: "Back",
  openWorkspace: "Open workspace",
  createAgent: "Create agent",
  skip: "Skip for now",
  continue: "Continue",
  needHand: "Need a hand?",
  needHandBody: "Set up your first agents with us on a 15 minute call.",
  booked: "Walkthrough booked",
  bookedBody: "{when}. We’ll send a calendar invite.",
  changeTime: "Change time",
  bookWalkthrough: "Book a walkthrough",
  pickTime: "Pick a time",
  pickTimeHint: "15 min video call, in your time zone",
  keepTime: "Keep this time",
  bookCall: "Book call",
  ready: "{name} is ready",
  readySub: "Here’s what you set up. You can change any of it later.",
  rowWorkspace: "Workspace",
  rowTools: "Tools",
  rowTeam: "Team",
  rowAgent: "Agent",
  toolsConnected: "{count} connected",
  noToolsYet: "No tools yet",
  toolsAdvice: "Agents work best with at least one",
  invitesPendingOne: "1 invite pending",
  invitesPending: "{count} invites pending",
  justYou: "Just you for now",
  invitesEmail: "They’ll get an email with a link",
  inviteLater: "Invite people any time from Settings",
  live: "Live",
  firstTask: "Picks up its first task in a moment",
  add: "Add",
  edit: "Edit",
  addRow: "Add {row}",
  editRow: "Edit {row}",
  genericError: "Something went wrong. Try again.",
};

type Messages = typeof FIRST_RUN_MESSAGES;

export interface FirstRunTool {
  id: string;
  name: string;
  blurb: string;
  icon: LucideIcon;
  tone: FirstRunTone;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  tone: FirstRunTone;
  instructions: string;
}

const softTone: Record<FirstRunTone, string> = {
  orange: "bg-category-7/12 text-category-7-foreground",
  teal: "bg-category-6/12 text-category-6-foreground",
  violet: "bg-category-5/12 text-category-5-foreground",
  amber: "bg-category-3/12 text-category-3-foreground",
  rose: "bg-category-4/12 text-category-4-foreground",
  info: "bg-info/12 text-info-foreground",
  success: "bg-success/12 text-success-foreground",
  destructive: "bg-destructive/12 text-destructive-foreground",
};

const tileTone: Record<FirstRunTone, string> = {
  orange: "bg-category-7-strong",
  teal: "bg-category-6-strong",
  violet: "bg-category-5-strong",
  amber: "bg-category-3-strong",
  rose: "bg-category-4-strong",
  info: "bg-category-1-strong",
  success: "bg-category-2-strong",
  destructive: "bg-category-4-strong",
};

const SWATCHES = ["orange", "teal", "violet", "amber", "info", "rose"] as const;
const ROLES: InviteRole[] = ["admin", "member", "viewer"];

const spring = { type: "spring", stiffness: 420, damping: 38 } as const;
const easeOut = [0.23, 1, 0.32, 1] as const;
const press = "transition-[box-shadow,transform,background-color] duration-150 ease-out active:scale-[0.97]";
const STEPS = ["workspace", "tools", "team", "agent"] as const;
const STEP_COUNT = STEPS.length;

function initials(v: string) {
  const parts = v.trim().split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function useReducedMotionAfterMount() {
  const prefers = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && !!prefers;
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function Rolling({ value }: { value: number | string }) {
  const reduce = useReducedMotionAfterMount();
  return (
    <span className="relative inline-flex overflow-hidden tabular-nums">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: "-100%", opacity: 0 }}
          initial={reduce ? { opacity: 0 } : { y: "100%", opacity: 0 }}
          key={value}
          transition={spring}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}


function CheckDot({ checked, active }: { checked: boolean; active?: boolean }) {
  const reduce = useReducedMotionAfterMount();
  return (
    <motion.span
      animate={checked && !reduce ? { scale: [1, 1.12, 1] } : { scale: 1 }}
      className={cn(
        "relative flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-200",
        checked ? "border-primary bg-primary text-primary-foreground" : active ? "border-foreground/72 bg-background" : "border-input bg-background",
      )}
      transition={{ duration: 0.3, times: [0, 0.4, 1], ease: "easeOut" }}
    >
      {active && !checked && <span className="size-1.5 rounded-full bg-primary" />}
      <svg aria-hidden className="absolute size-3" fill="none" viewBox="0 0 24 24">
        <motion.path
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          d="M5 12.5l4.5 4.5L19 7.5"
          initial={false}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3.5}
          transition={reduce ? { duration: 0.15 } : { duration: 0.25, delay: checked ? 0.05 : 0, ease: "easeOut" }}
        />
      </svg>
    </motion.span>
  );
}

interface ChecklistItem {
  label: string;
  hint: string;
  done: boolean;
  step: number;
}

function Checklist({ items, current, onGo, t }: { items: ChecklistItem[]; current: number | null; onGo: (step: number) => void; t: Messages }) {
  const reduce = useReducedMotionAfterMount();
  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="flex flex-col">
      <div className="px-2">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-medium">{doneCount === items.length ? t.allDone : t.progress}</span>
          <span className="flex text-muted-foreground tabular-nums">
            <Rolling value={doneCount} />
            &nbsp;{interpolate(t.ofTotal, { total: items.length })}
          </span>
        </div>
        <span className="mt-2 block h-1 overflow-hidden rounded-full bg-foreground/8">
          <motion.span
            animate={{ scaleX: doneCount / items.length }}
            className="block h-full origin-left rounded-full bg-primary/72"
            initial={false}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 32 }}
          />
        </span>
      </div>
      <ol className="mt-4 flex flex-col gap-px">
        {items.map((item) => {
          const active = current === item.step;
          return (
            <li key={item.label}>
              <button
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex w-full cursor-pointer items-start gap-2.5 rounded-md px-2 py-2 text-start outline-none transition-[background-color,scale] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]",
                  active ? "bg-accent" : "hover:bg-accent/60",
                )}
                onClick={() => onGo(item.step)}
                type="button"
              >
                <CheckDot active={active} checked={item.done} />
                <span className="min-w-0 flex-1">
                  <span className={cn("block font-medium leading-5 transition-colors", item.done && !active && "text-muted-foreground")}>{item.label}</span>
                  <span className="block truncate text-muted-foreground text-xs">{item.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-balance font-heading font-semibold text-2xl tracking-tight">{title}</h2>
      <p className="mt-1.5 text-pretty text-muted-foreground">{sub}</p>
    </div>
  );
}

function FieldLabelText({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label className="mb-2 block font-medium" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

export interface FirstRunProps {
  /** Your product's name, shown in the header and copy. */
  product: string;
  /** The host workspace URLs live under, e.g. "hearth.app". */
  domain: string;
  defaultWorkspaceName?: string;
  defaultUseCases?: string[];
  /** Use-case chips on step 1. */
  useCases: string[];
  tools: FirstRunTool[];
  /** Tools already connected, e.g. after returning from an OAuth redirect. */
  connectedToolIds?: string[];
  templates: AgentTemplate[];
  /** Addresses to suggest on the invite step, e.g. colleagues on the signup domain. */
  inviteSuggestions?: string[];
  /** Walkthrough call slots as ISO date-times; the card shows when there are slots and `onBookWalkthrough`. */
  walkthroughSlots?: string[];
  /** Where "Open workspace" goes once setup is done; the link is hidden without it. */
  workspaceHref?: string;
  /** Whether a workspace URL is free; checked as the user types. */
  checkSlug: (slug: string) => Promise<boolean>;
  /** Saves step 1. Fail with `fieldErrors.slug` if the URL was taken meanwhile. */
  onSaveWorkspace: Action<WorkspaceStepInput>;
  /** Connects a tool, e.g. after your OAuth flow. Resolve once it's connected. */
  onConnectTool: Action<string>;
  onDisconnectTool?: Action<string>;
  onInvite: Action<InviteStepInput>;
  onCancelInvite?: Action<string>;
  /** Creates the agent on the last step; the finish view shows once it resolves. */
  onCreateAgent: Action<AgentInput, unknown>;
  onBookWalkthrough?: Action<string>;
  className?: string;
}

const failMessage = (result: { error?: string; fieldErrors?: Record<string, string | string[]> }, fallback: string) =>
  Object.values(result.fieldErrors ?? {}).flat()[0] ?? result.error ?? fallback;

const noAction = async () => {};

function FirstRunScreen({
  product,
  domain,
  defaultWorkspaceName = "",
  defaultUseCases = [],
  useCases,
  tools,
  connectedToolIds = [],
  templates,
  inviteSuggestions = [],
  walkthroughSlots = [],
  workspaceHref,
  checkSlug,
  onSaveWorkspace,
  onConnectTool,
  onDisconnectTool,
  onInvite,
  onCancelInvite,
  onCreateAgent,
  onBookWalkthrough,
  className,
}: FirstRunProps) {
  const t = useMessages("firstRun", FIRST_RUN_MESSAGES);
  const reduce = useReducedMotionAfterMount();
  const ids = useId();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [finished, setFinished] = useState(false);
  const [left, setLeft] = useState<number[]>([]);
  const [stepError, setStepError] = useState("");

  const [name, setName] = useState(defaultWorkspaceName);
  const [slug, setSlug] = useState(() => slugify(defaultWorkspaceName));
  const [slugEdited, setSlugEdited] = useState(false);
  const [availability, setAvailability] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [picked, setPicked] = useState<string[]>(defaultUseCases);
  const [color, setColor] = useState<WorkspaceColor>("teal");

  const [connected, setConnected] = useState<string[]>(connectedToolIds);

  const [draft, setDraft] = useState<string[]>([]);
  const [emailText, setEmailText] = useState("");
  const [emailError, setEmailError] = useState("");
  const [shake, setShake] = useState(0);
  const [role, setRole] = useState<InviteRole>("member");
  const [invites, setInvites] = useState<{ email: string; role: InviteRole }[]>([]);

  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [agentName, setAgentName] = useState(templates[0]?.name ?? "");
  const [agentNameEdited, setAgentNameEdited] = useState(false);
  const [instructions, setInstructions] = useState(templates[0]?.instructions ?? "");

  // Ask the backend straight away for the starting URL, then once typing
  // pauses; ignore answers for an older slug.
  const initialSlug = useState(() => slugify(defaultWorkspaceName))[0];
  useEffect(() => {
    if (!slug) {
      setAvailability("idle");
      return;
    }
    let current = true;
    setAvailability("checking");
    const timer = setTimeout(
      () => {
        checkSlug(slug).then(
          (free) => current && setAvailability(free ? "available" : "taken"),
          () => current && setAvailability("idle"),
        );
      },
      slug === initialSlug ? 0 : 300,
    );
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [checkSlug, slug, initialSlug]);

  const go = (target: number) => {
    setDir(finished || target > step ? 1 : -1);
    setFinished(false);
    setStepError("");
    setStep(target);
  };
  const advance = () => {
    setLeft((l) => (l.includes(step) ? l : [...l, step]));
    go(step + 1);
  };

  const save = useAction(onSaveWorkspace);
  const connect = useAction(onConnectTool, {
    onSuccess: (_, id) => setConnected((c) => (c.includes(id) ? c : [...c, id])),
    onError: setStepError,
  });
  const disconnect = useAction(onDisconnectTool ?? noAction, {
    optimistic: (id) => {
      setConnected((c) => c.filter((x) => x !== id));
      return () => setConnected((c) => (c.includes(id) ? c : [...c, id]));
    },
    onError: setStepError,
  });
  const invite = useAction(onInvite);
  const cancelInvite = useAction(onCancelInvite ?? noAction, {
    optimistic: (email) => {
      const before = invites;
      setInvites((l) => l.filter((x) => x.email !== email));
      return () => setInvites(before);
    },
    onError: setStepError,
  });
  const create = useAction(onCreateAgent);

  const connectedTools = tools.filter((tool) => connected.includes(tool.id));
  const template = templates.find((x) => x.id === templateId) ?? templates[0];
  const slugTaken = availability === "taken";
  const workspaceValid = !!name.trim() && !!slug && availability === "available";

  const doneByStep = [left.includes(0) || finished, connectedTools.length > 0, invites.length > 0, finished];

  const checklist: ChecklistItem[] = [
    { label: t.checkName, hint: name.trim() ? `${domain}/${slug || "…"}` : t.checkNamePending, done: doneByStep[0], step: 0 },
    {
      label: t.checkTools,
      hint: connectedTools.length
        ? connectedTools.map((x) => x.name).join(", ")
        : left.includes(1)
          ? t.skipped
          : interpolate(t.checkToolsMore, {
              names: tools
                .slice(0, 2)
                .map((x) => x.name)
                .join(", "),
            }),
      done: doneByStep[1],
      step: 1,
    },
    {
      label: t.checkTeam,
      hint: invites.length
        ? invites.length === 1
          ? t.checkTeamSentOne
          : interpolate(t.checkTeamSent, { count: invites.length })
        : left.includes(2)
          ? t.skipped
          : t.checkTeamPending,
      done: doneByStep[2],
      step: 2,
    },
    { label: t.checkAgent, hint: finished ? interpolate(t.checkAgentLive, { name: agentName }) : t.checkAgentPending, done: doneByStep[3], step: 3 },
  ];

  const next = async () => {
    setStepError("");
    if (step === 0) {
      const result = await save.run({ name: name.trim(), slug, color, useCases: picked });
      if (!result.ok) {
        if (result.fieldErrors?.slug) setAvailability("taken");
        setStepError(failMessage(result, t.genericError));
        return;
      }
    }
    if (step === STEP_COUNT - 1) {
      const result = await create.run({ templateId, name: agentName.trim(), instructions });
      if (!result.ok) {
        setStepError(failMessage(result, t.genericError));
        return;
      }
      setLeft((l) => (l.includes(step) ? l : [...l, step]));
      setDir(1);
      setFinished(true);
      return;
    }
    advance();
  };

  const onName = (v: string) => {
    setName(v);
    if (!slugEdited) setSlug(slugify(v));
  };

  const toggleTool = (id: string) => {
    if (connect.isPending(id) || disconnect.isPending(id)) return;
    setStepError("");
    if (connected.includes(id)) disconnect.run(id, id);
    else connect.run(id, id);
  };

  const commitEmail = (raw: string) => {
    const v = raw.trim().replace(/,$/, "");
    if (!v) return true;
    if (!isEmail(v)) {
      setEmailError(interpolate(t.notEmail, { value: v }));
      setShake((n) => n + 1);
      return false;
    }
    setEmailError("");
    setDraft((d) => (d.includes(v) || invites.some((i) => i.email === v) ? d : [...d, v]));
    setEmailText("");
    return true;
  };

  const onEmailKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", ",", " ", "Tab"].includes(e.key) && emailText.trim()) {
      e.preventDefault();
      commitEmail(emailText);
    } else if (e.key === "Backspace" && !emailText && draft.length) {
      setDraft((d) => d.slice(0, -1));
    }
  };

  const sendInvites = async () => {
    if (!commitEmail(emailText)) return;
    const typed = emailText.trim();
    const pending = [...draft, ...(isEmail(typed) && !draft.includes(typed) ? [typed] : [])].filter(
      (email) => !invites.some((i) => i.email === email),
    );
    if (!pending.length) return;
    setStepError("");
    const invitations = pending.map((email) => ({ email, role }));
    const result = await invite.run({ invitations });
    if (!result.ok) {
      setStepError(failMessage(result, t.genericError));
      return;
    }
    setInvites((list) => [...invitations, ...list]);
    setDraft([]);
    setEmailText("");
  };

  const pickTemplate = (id: string) => {
    const chosen = templates.find((x) => x.id === id);
    if (!chosen) return;
    setTemplateId(chosen.id);
    setInstructions(chosen.instructions);
    if (!agentNameEdited) setAgentName(chosen.instructions ? chosen.name : t.defaultAgentName);
  };

  const busy = save.isPending() || create.isPending();
  const canNext = (step === 0 ? workspaceValid : step === 3 ? !!agentName.trim() : true) && !busy;
  const skipping = (step === 1 && !connectedTools.length) || (step === 2 && !invites.length);
  const showWalkthrough = !!onBookWalkthrough && walkthroughSlots.length > 0;
  const roleLabel = (r: InviteRole) => t[r];
  const roleItems = Object.fromEntries(ROLES.map((r) => [r, roleLabel(r)]));

  const variants = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * 32 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * -24, transition: { duration: 0.12 } }),
  };

  return (
    <div className={cn("@container/screen relative isolate flex h-[760px] w-full overflow-hidden bg-background text-foreground text-sm", className)}>
      <aside className="hidden w-64 shrink-0 flex-col border-e bg-muted/30 px-3 py-4 @3xl/screen:flex">
        <div className="flex h-8 items-center gap-2 px-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FlameIcon className="size-3.5" />
          </span>
          <span className="font-medium">{product}</span>
        </div>
        <div className="mt-8 px-2">
          <p className="font-medium">{t.setUp}</p>
          <p className="mt-0.5 text-muted-foreground text-xs">{t.takesMinutes}</p>
        </div>
        <div className="mt-6">
          <Checklist current={finished ? null : step} items={checklist} onGo={go} t={t} />
        </div>
        {showWalkthrough ? <WalkthroughCard onBook={onBookWalkthrough} slots={walkthroughSlots} t={t} /> : null}
      </aside>

      <div className="@container flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 @3xl/screen:hidden">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FlameIcon className="size-3.5" />
          </span>
          <span className="font-medium">{product}</span>
          <span className="truncate text-muted-foreground">{t.setUpCrumb}</span>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto flex max-w-2xl flex-col px-5 pt-8 pb-10 @2xl:px-6 @3xl/screen:pt-16">
            {!finished && (
              <div className="mb-6 flex items-center gap-3">
                <span className="shrink-0 text-muted-foreground text-xs tabular-nums">{interpolate(t.stepOf, { n: step + 1, total: STEP_COUNT })}</span>
                <div aria-hidden className="flex w-28 gap-1">
                  {STEPS.map((key, i) => (
                    <span className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/10" key={key}>
                      <motion.span
                        animate={{ scaleX: i <= step ? 1 : 0 }}
                        className="block h-full origin-left rounded-full bg-primary/80"
                        initial={false}
                        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 36 }}
                      />
                    </span>
                  ))}
                </div>
              </div>
            )}
            <AnimatePresence custom={dir} initial={false} mode="wait">
              {finished ? (
                <FinishView
                  agentName={agentName}
                  color={color}
                  invites={invites.length}
                  key="finish"
                  onEdit={go}
                  t={t}
                  tools={connectedTools}
                  url={`${domain}/${slug}`}
                  workspace={name}
                />
              ) : (
                <motion.section
                  animate="center"
                  custom={dir}
                  exit="exit"
                  initial="enter"
                  key={step}
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 34 }}
                  variants={variants}
                >
                  {step === 0 && (
                    <>
                      <StepTitle sub={t.workspaceSub} title={t.workspaceTitle} />
                      <div className="flex flex-col gap-5">
                        <div className="flex items-center gap-4">
                          <span
                            className={cn(
                              "flex size-14 shrink-0 items-center justify-center rounded-2xl font-heading font-semibold text-lg text-white tabular-nums transition-colors duration-200 ease-out",
                              tileTone[color],
                            )}
                          >
                            {initials(name)}
                          </span>
                          <div>
                            <p className="mb-1.5 font-medium" id={`${ids}-colour`}>
                              {t.colour}
                            </p>
                            <RadioGroup
                              aria-labelledby={`${ids}-colour`}
                              className="-ms-1 flex flex-wrap gap-0.5"
                              onValueChange={(value) => setColor(value as WorkspaceColor)}
                              value={color}
                            >
                              {SWATCHES.map((tone) => (
                                <Radio.Root
                                  aria-label={t[tone]}
                                  className="relative flex size-8 cursor-pointer items-center justify-center rounded-full outline-none transition-transform duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.92]"
                                  key={tone}
                                  value={tone}
                                >
                                  {color === tone && (
                                    <motion.span
                                      className="absolute inset-0.5 rounded-full border-2 border-foreground/70"
                                      layoutId={`${ids}-swatch`}
                                      transition={reduce ? { duration: 0 } : spring}
                                    />
                                  )}
                                  <span className={cn("size-5 rounded-full", tileTone[tone])} />
                                </Radio.Root>
                              ))}
                            </RadioGroup>
                          </div>
                        </div>
                        <div>
                          <FieldLabelText htmlFor={`${ids}-name`}>{t.workspaceName}</FieldLabelText>
                          <Input
                            aria-describedby={`${ids}-name-hint`}
                            aria-invalid={!name.trim() || undefined}
                            id={`${ids}-name`}
                            onChange={(e) => onName(e.target.value)}
                            placeholder={t.workspaceNamePlaceholder}
                            value={name}
                          />
                          <p className={cn("mt-1.5 text-xs", name.trim() ? "text-muted-foreground" : "text-destructive-foreground")} id={`${ids}-name-hint`}>
                            {name.trim() ? t.nameHint : t.nameMissing}
                          </p>
                        </div>
                        <div>
                          <FieldLabelText htmlFor={`${ids}-slug`}>{t.workspaceUrl}</FieldLabelText>
                          <div
                            className={cn(
                              "flex w-full items-center overflow-hidden rounded-lg border border-input bg-background shadow-xs/5 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/24",
                              (slugTaken || !slug) && "border-destructive/48 focus-within:border-destructive/64 focus-within:ring-destructive/16",
                            )}
                          >
                            <span className="shrink-0 border-e bg-muted px-2.5 py-1.5 text-muted-foreground">{domain}/</span>
                            <input
                              aria-describedby={`${ids}-slug-hint`}
                              aria-invalid={slugTaken || !slug || undefined}
                              className="h-8 min-w-0 flex-1 bg-transparent px-2.5 font-mono text-sm outline-none"
                              id={`${ids}-slug`}
                              onChange={(e) => {
                                setSlugEdited(true);
                                setSlug(slugify(e.target.value));
                              }}
                              value={slug}
                            />
                            <AnimatePresence initial={false} mode="popLayout">
                              {availability !== "idle" && (
                                <motion.span
                                  animate={{ scale: 1, opacity: 1 }}
                                  className={cn(
                                    "me-2.5 flex items-center gap-1 text-xs",
                                    availability === "taken" && "text-destructive-foreground",
                                    availability === "available" && "text-success-foreground",
                                    availability === "checking" && "text-muted-foreground",
                                  )}
                                  exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.1 } }}
                                  initial={reduce ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
                                  key={availability}
                                  transition={{ duration: 0.18, ease: easeOut }}
                                >
                                  {availability === "checking" ? (
                                    <Spinner className="size-3.5" />
                                  ) : availability === "taken" ? (
                                    <XIcon className="size-3.5" />
                                  ) : (
                                    <CheckIcon className="size-3.5" />
                                  )}
                                  <span className="hidden @md:inline">
                                    {availability === "checking" ? t.checking : availability === "taken" ? t.taken : t.available}
                                  </span>
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>
                          <p className={cn("mt-1.5 text-xs", slugTaken || !slug ? "text-destructive-foreground" : "text-muted-foreground")} id={`${ids}-slug-hint`}>
                            {!slug
                              ? t.slugMissing
                              : slugTaken
                                ? interpolate(t.slugTaken, { url: `${domain}/${slug}` })
                                : slugEdited
                                  ? t.slugEdited
                                  : t.slugFromName}
                          </p>
                        </div>
                        <div>
                          <p className="mb-2 font-medium">{interpolate(t.useFor, { product })}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {useCases.map((u) => {
                              const on = picked.includes(u);
                              return (
                                <motion.button
                                  aria-pressed={on}
                                  className={cn(
                                    "flex h-8 cursor-pointer items-center gap-1 rounded-full border px-3 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
                                    on ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground",
                                  )}
                                  key={u}
                                  layout={!reduce}
                                  onClick={() => setPicked((p) => (on ? p.filter((x) => x !== u) : [...p, u]))}
                                  transition={spring}
                                  type="button"
                                  whileTap={reduce ? undefined : { scale: 0.97 }}
                                >
                                  <AnimatePresence initial={false}>
                                    {on && (
                                      <motion.span
                                        animate={{ width: "auto", opacity: 1 }}
                                        className="overflow-hidden"
                                        exit={{ width: 0, opacity: 0 }}
                                        initial={{ width: 0, opacity: 0 }}
                                        transition={spring}
                                      >
                                        <CheckIcon className="size-3.5" />
                                      </motion.span>
                                    )}
                                  </AnimatePresence>
                                  {u}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <StepTitle sub={t.toolsSub} title={t.toolsTitle} />
                      <div className="divide-y overflow-hidden rounded-xl border bg-card">
                        {tools.map((tool, i) => {
                          const busyTool = connect.isPending(tool.id) || disconnect.isPending(tool.id);
                          const isOn = connected.includes(tool.id);
                          const Icon = tool.icon;
                          const look = cn(
                            "flex h-8 w-28 shrink-0 items-center justify-center gap-1 overflow-hidden rounded-lg border px-2.5 font-medium text-xs shadow-xs/5",
                            isOn ? "border-success/32 bg-success/8 text-success-foreground dark:bg-success/16" : "bg-background text-foreground",
                          );
                          const content = (
                            <>
                              {busyTool && <Spinner className="size-3.5" />}
                              {isOn && !busyTool && (
                                <motion.span
                                  animate={{ scale: 1, opacity: 1 }}
                                  initial={reduce ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
                                  transition={{ duration: 0.18, ease: easeOut }}
                                >
                                  <CheckIcon className="size-3.5" strokeWidth={3} />
                                </motion.span>
                              )}
                              {!isOn && !busyTool && <PlusIcon className="size-3.5" />}
                              {busyTool ? t.connecting : isOn ? t.connected : t.connect}
                            </>
                          );
                          return (
                            <motion.div
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-3 px-4 py-3"
                              initial={reduce ? false : { opacity: 0, y: 6 }}
                              key={tool.id}
                              transition={{ duration: 0.22, ease: easeOut, delay: i * 0.03 }}
                            >
                              <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", softTone[tool.tone])}>
                                <Icon className="size-4.5" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">{tool.name}</span>
                                <span className="block truncate text-muted-foreground text-xs">{tool.blurb}</span>
                              </span>
                              {isOn && !onDisconnectTool ? (
                                <span className={look}>{content}</span>
                              ) : (
                                <button
                                  aria-label={interpolate(busyTool ? t.connectingLabel : isOn ? t.connectedLabel : t.connectLabel, { name: tool.name })}
                                  className={cn(
                                    look,
                                    "cursor-pointer outline-none transition-[background-color,border-color,color,transform] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] disabled:cursor-default",
                                    isOn ? "hover:bg-success/14" : "hover:bg-accent",
                                  )}
                                  disabled={busyTool}
                                  onClick={() => toggleTool(tool.id)}
                                  type="button"
                                >
                                  {content}
                                </button>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                      <p className="mt-3 flex text-muted-foreground text-xs tabular-nums">
                        <Rolling value={connectedTools.length} />
                        &nbsp;{interpolate(t.toolsCount, { total: tools.length })}
                      </p>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <StepTitle sub={t.teamSub} title={t.teamTitle} />
                      <div className="flex flex-col gap-2">
                        <FieldLabelText htmlFor={`${ids}-email`}>{t.emails}</FieldLabelText>
                        <div className="flex flex-col gap-2 @md:flex-row">
                          <motion.div
                            animate={shake && !reduce ? { x: shake % 2 ? [0, -6, 6, -4, 4, 0] : [0, 6, -6, 4, -4, 0] } : { x: 0 }}
                            className={cn(
                              "flex min-h-9 min-w-0 flex-1 flex-wrap items-center gap-1 rounded-lg border border-input bg-background px-1.5 py-1 shadow-xs/5 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/24",
                              emailError && "border-destructive/60",
                            )}
                            transition={{ duration: 0.35 }}
                          >
                            <AnimatePresence initial={false} mode="popLayout">
                              {draft.map((d) => (
                                <motion.span
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="flex h-6 items-center gap-1 rounded-full bg-muted ps-2 pe-0.5 text-xs"
                                  exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.1 } }}
                                  initial={reduce ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
                                  key={d}
                                  layout={!reduce}
                                  transition={{ type: "spring", stiffness: 520, damping: 40 }}
                                >
                                  {d}
                                  <button
                                    aria-label={interpolate(t.removeEmail, { email: d })}
                                    className="relative flex size-5 cursor-pointer items-center justify-center rounded-full text-muted-foreground outline-none transition-colors before:absolute before:-inset-1.5 before:rounded-full hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                                    onClick={() => setDraft((x) => x.filter((y) => y !== d))}
                                    type="button"
                                  >
                                    <XIcon className="size-3" />
                                  </button>
                                </motion.span>
                              ))}
                            </AnimatePresence>
                            <input
                              aria-describedby={`${ids}-email-err`}
                              aria-invalid={!!emailError || undefined}
                              className="h-6 min-w-32 flex-1 bg-transparent px-1 outline-none placeholder:text-muted-foreground/72"
                              id={`${ids}-email`}
                              onBlur={() => emailText.trim() && commitEmail(emailText)}
                              onChange={(e) => {
                                setEmailText(e.target.value);
                                if (emailError) setEmailError("");
                              }}
                              onKeyDown={onEmailKey}
                              placeholder={draft.length ? t.addAnother : t.emailPlaceholder}
                              value={emailText}
                            />
                          </motion.div>
                          <div className="flex gap-2">
                            <Select items={roleItems} onValueChange={(v) => v && setRole(v as InviteRole)} value={role}>
                              <SelectTrigger aria-label={t.role} className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent align="start">
                                {ROLES.map((r) => (
                                  <SelectItem key={r} value={r}>
                                    {roleLabel(r)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              className={cn("flex-1 @md:flex-none", press)}
                              disabled={(!draft.length && !emailText.trim()) || invite.isPending()}
                              onClick={sendInvites}
                            >
                              {invite.isPending() ? <Spinner /> : <UserPlusIcon />}
                              {t.invite}
                            </Button>
                          </div>
                        </div>
                        <p className={cn("text-xs", emailError ? "text-destructive-foreground" : "text-muted-foreground")} id={`${ids}-email-err`}>
                          {emailError || t.emailHint}
                        </p>
                      </div>

                      {inviteSuggestions.some((s) => !invites.some((i) => i.email === s) && !draft.includes(s)) && (
                        <div className="mt-4">
                          <p className="mb-2 font-medium">{t.suggested}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {inviteSuggestions
                              .filter((s) => !invites.some((i) => i.email === s) && !draft.includes(s))
                              .map((s) => (
                                <button
                                  className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-dashed ps-1.5 pe-3 text-xs outline-none transition-[background-color,transform] duration-150 ease-out hover:border-solid hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
                                  key={s}
                                  onClick={() => setDraft((d) => [...d, s])}
                                  type="button"
                                >
                                  <Avatar className="size-5 text-[9px]">
                                    <AvatarFallback>{initials(s)}</AvatarFallback>
                                  </Avatar>
                                  {s}
                                  <PlusIcon className="size-3 text-muted-foreground" />
                                </button>
                              ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-5 rounded-xl border">
                        <div className="flex items-center justify-between border-b px-3 py-2">
                          <span className="font-medium text-xs">{t.pendingInvites}</span>
                          <span className="text-muted-foreground text-xs">
                            <Rolling value={invites.length} />
                          </span>
                        </div>
                        <ul className="divide-y">
                          <AnimatePresence initial={false}>
                            {invites.length === 0 && (
                              <motion.li
                                animate={{ opacity: 1 }}
                                className="px-3 py-6 text-center text-muted-foreground text-xs"
                                exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
                                initial={{ opacity: 0 }}
                                key="empty"
                              >
                                {t.noInvites}
                              </motion.li>
                            )}
                            {invites.map((inv) => (
                              <motion.li
                                animate={{ opacity: 1, height: "auto" }}
                                className="overflow-hidden"
                                exit={{ opacity: 0, height: 0 }}
                                initial={reduce ? false : { opacity: 0, height: 0 }}
                                key={inv.email}
                                transition={spring}
                              >
                                <div className="flex items-center gap-2.5 py-2 ps-3 pe-2">
                                  <Avatar className="size-7 text-[11px]">
                                    <AvatarFallback>{initials(inv.email)}</AvatarFallback>
                                  </Avatar>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate">{inv.email}</span>
                                    <span className="block text-muted-foreground text-xs">{t.invitePending}</span>
                                  </span>
                                  <Badge variant="outline">{roleLabel(inv.role)}</Badge>
                                  {onCancelInvite ? (
                                    <Button
                                      aria-label={interpolate(t.cancelInvite, { email: inv.email })}
                                      className={press}
                                      disabled={cancelInvite.isPending(inv.email)}
                                      onClick={() => cancelInvite.run(inv.email, inv.email)}
                                      size="icon-sm"
                                      variant="ghost"
                                    >
                                      <XIcon />
                                    </Button>
                                  ) : null}
                                </div>
                              </motion.li>
                            ))}
                          </AnimatePresence>
                        </ul>
                      </div>
                    </>
                  )}

                  {step === 3 && template && (
                    <>
                      <StepTitle sub={t.agentSub} title={t.agentTitle} />
                      <div className="grid grid-cols-1 gap-6 @3xl:grid-cols-[1fr_16rem]">
                        <div className="flex min-w-0 flex-col gap-4">
                          <RadioGroup aria-label={t.template} className="grid grid-cols-2 gap-2" onValueChange={(v) => pickTemplate(v as string)} value={templateId}>
                            {templates.map((x) => {
                              const Icon = x.icon;
                              return (
                                <Radio.Root
                                  className="relative flex cursor-pointer flex-col items-start gap-2 rounded-xl border bg-card p-3 text-start outline-none transition-[background-color,transform] duration-150 ease-out hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
                                  key={x.id}
                                  value={x.id}
                                >
                                  {x.id === templateId && (
                                    <motion.span
                                      className="absolute -inset-px rounded-xl border-2 border-primary"
                                      layoutId={`${ids}-template`}
                                      transition={reduce ? { duration: 0 } : spring}
                                    />
                                  )}
                                  <span className={cn("relative flex size-8 items-center justify-center rounded-lg", softTone[x.tone])}>
                                    <Icon className="size-4" />
                                  </span>
                                  <span className="relative min-w-0">
                                    <span className="block font-medium leading-tight">{x.name}</span>
                                    <span className="block text-muted-foreground text-xs leading-snug">{x.description}</span>
                                  </span>
                                </Radio.Root>
                              );
                            })}
                          </RadioGroup>
                          <div>
                            <FieldLabelText htmlFor={`${ids}-agent`}>{t.agentName}</FieldLabelText>
                            <Input
                              aria-describedby={`${ids}-agent-hint`}
                              aria-invalid={!agentName.trim() || undefined}
                              id={`${ids}-agent`}
                              onChange={(e) => {
                                setAgentNameEdited(true);
                                setAgentName(e.target.value);
                              }}
                              value={agentName}
                            />
                            <p className={cn("mt-1.5 text-xs", agentName.trim() ? "text-muted-foreground" : "text-destructive-foreground")} id={`${ids}-agent-hint`}>
                              {agentName.trim() ? t.agentNameHint : t.agentNameMissing}
                            </p>
                          </div>
                          <div>
                            <FieldLabelText htmlFor={`${ids}-instr`}>{t.instructions}</FieldLabelText>
                            <Textarea
                              id={`${ids}-instr`}
                              onChange={(e) => setInstructions(e.target.value)}
                              placeholder={t.instructionsPlaceholder}
                              value={instructions}
                            />
                          </div>
                        </div>

                        <div className="@3xl:sticky @3xl:top-0 @3xl:self-start">
                          <p className="mb-2 font-medium">{t.preview}</p>
                          <div className="rounded-xl border bg-card p-4">
                            <div className="flex items-center gap-2.5">
                              <AnimatePresence initial={false} mode="popLayout">
                                <motion.span
                                  animate={{ scale: 1, opacity: 1 }}
                                  className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", softTone[template.tone])}
                                  exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.1 } }}
                                  initial={reduce ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
                                  key={template.id}
                                  transition={{ duration: 0.2, ease: easeOut }}
                                >
                                  <BotIcon className="size-5" />
                                </motion.span>
                              </AnimatePresence>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">{agentName || t.untitled}</span>
                                <span className="block truncate text-muted-foreground text-xs">{interpolate(t.inWorkspace, { name: name || t.yourWorkspace })}</span>
                              </span>
                              <Badge className="bg-warning/8 text-warning-foreground dark:bg-warning/16" variant="secondary">
                                {t.draft}
                              </Badge>
                            </div>
                            <p className="mt-3 line-clamp-4 text-muted-foreground text-xs leading-relaxed">{instructions || t.noInstructions}</p>
                            <div className="mt-3 flex flex-wrap gap-1">
                              {connectedTools.length ? (
                                connectedTools.map((x) => {
                                  const Icon = x.icon;
                                  return (
                                    <span className="flex h-6 items-center gap-1 rounded-full bg-muted px-2 text-xs" key={x.id}>
                                      <Icon className="size-3" />
                                      {x.name}
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-muted-foreground text-xs">{t.noTools}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </div>

        <footer className="shrink-0 border-t bg-background">
          {stepError ? (
            <p className="mx-auto max-w-2xl px-5 pt-2 text-destructive-foreground text-xs @2xl:px-6" role="alert">
              {stepError}
            </p>
          ) : null}
          <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-5 @2xl:px-6">
            {finished ? null : (
              <Button className={cn("-ms-2.5", press)} disabled={step === 0 || busy} onClick={() => go(step - 1)} variant="ghost">
                <ArrowLeftIcon />
                {t.back}
              </Button>
            )}
            <div className="ms-auto">
              {finished ? (
                workspaceHref ? (
                  <WirefrontLink className={cn(buttonVariants(), "min-w-32", press)} href={workspaceHref}>
                    {t.openWorkspace}
                    <ArrowRightIcon />
                  </WirefrontLink>
                ) : null
              ) : (
                <Button className={cn("min-w-32", press)} disabled={!canNext} onClick={next} variant={skipping ? "outline" : "default"}>
                  {busy ? <Spinner /> : null}
                  {step === STEP_COUNT - 1 ? t.createAgent : skipping ? t.skip : t.continue}
                  {busy ? null : step === STEP_COUNT - 1 ? <SparklesIcon /> : <ArrowRightIcon />}
                </Button>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function WalkthroughCard({ slots, onBook, t }: { slots: string[]; onBook: Action<string>; t: Messages }) {
  const ids = useId();
  const format = useFormat();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState(slots[0] ?? "");
  const [booked, setBooked] = useState<string | null>(null);
  const book = useAction(onBook, {
    onSuccess: (_, slot) => {
      setBooked(slot);
      setOpen(false);
    },
  });
  const when = (slot: string) => format.date(slot, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <div className="mt-auto rounded-xl border bg-card p-2">
      <div className="flex items-start gap-2.5 px-1.5 pt-1.5 pb-2.5">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
            booked ? "bg-success/12 text-success-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {booked ? <CalendarCheckIcon className="size-4" /> : <LifeBuoyIcon className="size-4" />}
        </span>
        <div className="min-w-0">
          <p className="font-medium text-xs">{booked ? t.booked : t.needHand}</p>
          <p className="mt-0.5 text-pretty text-muted-foreground text-xs tabular-nums">
            {booked ? interpolate(t.bookedBody, { when: when(booked) }) : t.needHandBody}
          </p>
        </div>
      </div>
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger render={<Button className={cn("w-full", press)} size="sm" variant="outline" />}>
          {booked ? t.changeTime : t.bookWalkthrough}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64" side="top" sideOffset={6}>
          <p className="font-medium text-sm" id={`${ids}-title`}>
            {t.pickTime}
          </p>
          <p className="mt-0.5 text-muted-foreground text-xs">{t.pickTimeHint}</p>
          <RadioGroup aria-labelledby={`${ids}-title`} className="mt-3 flex flex-col gap-1" onValueChange={(v) => setChoice(v as string)} value={choice}>
            {slots.map((slot) => (
              <Radio.Root
                className="flex h-8 cursor-pointer items-center justify-between rounded-md border border-transparent px-2.5 text-start text-xs tabular-nums outline-none transition-[background-color,border-color,transform] duration-150 ease-out hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] data-checked:border-border data-checked:bg-accent data-checked:font-medium"
                key={slot}
                value={slot}
              >
                {when(slot)}
                {slot === choice && <CheckIcon className="size-3.5" />}
              </Radio.Root>
            ))}
          </RadioGroup>
          {book.error ? (
            <p className="mt-2 text-destructive-foreground text-xs" role="alert">
              {book.error}
            </p>
          ) : null}
          <Button
            className={cn("mt-3 w-full", press)}
            disabled={book.isPending()}
            onClick={() => (booked === choice ? setOpen(false) : book.run(choice))}
            size="sm"
          >
            {book.isPending() ? <Spinner /> : null}
            {booked === choice ? t.keepTime : t.bookCall}
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function FinishView({
  workspace,
  url,
  color,
  tools,
  invites,
  agentName,
  onEdit,
  t,
}: {
  workspace: string;
  url: string;
  color: WorkspaceColor;
  tools: FirstRunTool[];
  invites: number;
  agentName: string;
  onEdit: (step: number) => void;
  t: Messages;
}) {
  const reduce = useReducedMotionAfterMount();
  const rows: { step: number; label: string; value: ReactNode; icon: ReactNode; empty?: boolean }[] = [
    {
      step: 0,
      label: t.rowWorkspace,
      icon: (
        <span className={cn("flex size-8 items-center justify-center rounded-lg font-semibold text-[11px] text-white", tileTone[color])}>
          {initials(workspace)}
        </span>
      ),
      value: (
        <>
          <span className="block truncate font-medium">{workspace || t.yourWorkspace}</span>
          <span className="block truncate font-mono text-muted-foreground text-xs">{url}</span>
        </>
      ),
    },
    {
      step: 1,
      label: t.rowTools,
      empty: !tools.length,
      icon: (
        <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <PlugIcon className="size-4" />
        </span>
      ),
      value: (
        <>
          <span className="block truncate font-medium tabular-nums">
            {tools.length ? interpolate(t.toolsConnected, { count: tools.length }) : t.noToolsYet}
          </span>
          <span className="block truncate text-muted-foreground text-xs">
            {tools.length ? tools.map((x) => x.name).join(", ") : t.toolsAdvice}
          </span>
        </>
      ),
    },
    {
      step: 2,
      label: t.rowTeam,
      empty: !invites,
      icon: (
        <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <UsersIcon className="size-4" />
        </span>
      ),
      value: (
        <>
          <span className="block truncate font-medium tabular-nums">
            {invites ? (invites === 1 ? t.invitesPendingOne : interpolate(t.invitesPending, { count: invites })) : t.justYou}
          </span>
          <span className="block truncate text-muted-foreground text-xs">
            {invites ? t.invitesEmail : t.inviteLater}
          </span>
        </>
      ),
    },
    {
      step: 3,
      label: t.rowAgent,
      icon: (
        <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <BotIcon className="size-4" />
        </span>
      ),
      value: (
        <>
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium">{agentName}</span>
            <Badge className="bg-success/8 text-success-foreground dark:bg-success/16 shrink-0" variant="secondary">
              {t.live}
            </Badge>
          </span>
          <span className="block truncate text-muted-foreground text-xs">{t.firstTask}</span>
        </>
      ),
    },
  ];

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-md flex-col items-center pt-4 text-center"
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      transition={{ duration: 0.25, ease: easeOut }}
    >
      <div className="relative flex size-12 items-center justify-center">
        {!reduce && (
          <motion.span
            animate={{ scale: 1.9, opacity: 0 }}
            aria-hidden
            className="absolute inset-0 rounded-full border border-success/50"
            initial={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: easeOut }}
          />
        )}
        <motion.span
          animate={{ scale: 1, opacity: 1 }}
          className="flex size-12 items-center justify-center rounded-full bg-success/12 text-success-foreground"
          initial={reduce ? false : { scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.25, ease: easeOut }}
        >
          <svg aria-hidden className="size-6" fill="none" viewBox="0 0 24 24">
            <motion.path
              animate={{ pathLength: 1 }}
              d="M5 12.5l4.5 4.5L19 7.5"
              initial={reduce ? false : { pathLength: 0 }}
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              transition={{ duration: 0.3, delay: 0.12, ease: "easeOut" }}
            />
          </svg>
        </motion.span>
      </div>
      <h2 className="mt-4 text-balance font-heading font-semibold text-lg tracking-tight">
        {interpolate(t.ready, { name: workspace || t.yourWorkspace })}
      </h2>
      <p className="mt-1 text-pretty text-muted-foreground">{t.readySub}</p>

      <ul className="mt-6 w-full divide-y rounded-xl border bg-card text-start">
        {rows.map((r, i) => (
          <motion.li
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 py-2.5 ps-3 pe-2"
            initial={reduce ? false : { opacity: 0, y: 4 }}
            key={r.label}
            transition={{ duration: 0.22, ease: easeOut, delay: 0.12 + i * 0.035 }}
          >
            <span className="shrink-0">{r.icon}</span>
            <span className="min-w-0 flex-1">{r.value}</span>
            {r.empty ? (
              <Button aria-label={interpolate(t.addRow, { row: r.label.toLowerCase() })} className={press} onClick={() => onEdit(r.step)} size="sm" variant="outline">
                <PlusIcon />
                {t.add}
              </Button>
            ) : (
              <Button aria-label={interpolate(t.editRow, { row: r.label.toLowerCase() })} className={press} onClick={() => onEdit(r.step)} size="sm" variant="ghost">
                {t.edit}
              </Button>
            )}
          </motion.li>
        ))}
      </ul>

    </motion.section>
  );
}

export function FirstRun(props: FirstRunProps) {
  return (
    <ScreenBoundary name="FirstRun">
      <FirstRunScreen {...props} />
    </ScreenBoundary>
  );
}
