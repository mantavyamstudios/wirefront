import {
  ChevronDownIcon,
  ChevronRightIcon,
  KeyIcon,
  ShieldIcon,
  Trash2Icon,
  UserCogIcon,
  UserPlusIcon,
} from "lucide-react";
import type { ComponentType } from "react";
import { Avatar, AvatarFallback } from "@orbit/ui/avatar";

type Severity = "info" | "warn" | "danger";

interface Event {
  actor: string;
  initials: string;
  action: string;
  target?: string;
  Icon: ComponentType<{ className?: string }>;
  severity: Severity;
  time: string;
  ip?: string;
  diff?: { before: string; after: string };
}

const EVENTS: Event[] = [
  {
    actor: "Maya Okafor",
    initials: "MO",
    action: "rotated",
    target: "API key acme-prod-key-04",
    Icon: KeyIcon,
    severity: "warn",
    time: "2 min ago",
    ip: "203.0.113.42",
  },
  {
    actor: "James Lin",
    initials: "JL",
    action: "deleted",
    target: "workspace integration · Linear",
    Icon: Trash2Icon,
    severity: "danger",
    time: "32 min ago",
    ip: "198.51.100.7",
    diff: {
      before: '{"connected": true, "scope": "issues:rw"}',
      after: '{"connected": false}',
    },
  },
  {
    actor: "Riya Patel",
    initials: "RP",
    action: "promoted",
    target: "Dani Kim → Admin",
    Icon: UserCogIcon,
    severity: "warn",
    time: "1h ago",
    ip: "203.0.113.18",
  },
  {
    actor: "Auto",
    initials: "AT",
    action: "enabled",
    target: "SSO enforcement for @acme.dev",
    Icon: ShieldIcon,
    severity: "info",
    time: "3h ago",
  },
  {
    actor: "Mantavyam",
    initials: "SB",
    action: "invited",
    target: "8 new members to Marketing",
    Icon: UserPlusIcon,
    severity: "info",
    time: "5h ago",
    ip: "203.0.113.91",
  },
];

const SEV_RING: Record<Severity, string> = {
  info: "bg-foreground/[0.06] text-foreground",
  warn: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  danger: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
};

const SEV_DOT: Record<Severity, string> = {
  info: "bg-foreground/40",
  warn: "bg-amber-500",
  danger: "bg-rose-500",
};

export function TimelinesAuditShowcasePage() {
  return (
    <div className="min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          Security · Audit log
        </div>
        <h1 className="mt-1 font-heading text-2xl">Audit trail</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Last 30 days · 218 events · retained for 1 year on Business plan.
        </p>

        <div className="mt-6 rounded-xl border border-border/60 bg-background/40 px-3 py-3 sm:px-5">
          <ol className="relative">
            <span
              aria-hidden
              className="absolute top-2 bottom-2 left-[1.0625rem] w-px bg-border/50"
            />
            {EVENTS.map((e, i) => (
              <li
                key={i}
                className="relative grid grid-cols-[34px_minmax(0,1fr)_auto] items-start gap-3 py-3"
              >
                <span
                  className={
                    "z-10 grid size-[34px] place-items-center rounded-full ring-4 ring-background " +
                    SEV_RING[e.severity]
                  }
                >
                  <e.Icon className="size-3.5" />
                </span>
                <div className="min-w-0 pt-1.5">
                  {/* Wraps instead of truncating, so the action's target stays readable on phones. */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                    <Avatar className="size-5 shrink-0">
                      <AvatarFallback className="text-[10px]">
                        {e.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{e.actor}</span>
                    <span className="text-muted-foreground">{e.action}</span>
                    {e.target ? (
                      <span className="min-w-0 break-words text-foreground/85">
                        {e.target}
                      </span>
                    ) : null}
                  </div>
                  {e.diff ? (
                    <details className="group mt-2">
                      <summary className="inline-flex min-h-6 cursor-pointer list-none items-center gap-1 rounded bg-foreground/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] hover:bg-foreground/[0.06]">
                        <ChevronDownIcon className="size-3 -rotate-90 transition-transform group-open:rotate-0" />
                        diff
                      </summary>
                      <div className="mt-2 overflow-hidden rounded-md border border-border/60 font-mono text-[11px] [&>div]:break-all">
                        <div className="border-rose-500/20 border-b bg-rose-500/[0.06] px-2 py-1 text-rose-700 dark:text-rose-400">
                          - {e.diff.before}
                        </div>
                        <div className="bg-emerald-500/[0.06] px-2 py-1 text-emerald-700 dark:text-emerald-400">
                          + {e.diff.after}
                        </div>
                      </div>
                    </details>
                  ) : null}
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-[10px] text-muted-foreground">
                    <span className={"size-1 rounded-full " + SEV_DOT[e.severity]} />
                    <span className="sr-only">{e.severity} severity,</span>
                    {e.time}
                    {e.ip ? <span>· from {e.ip}</span> : null}
                  </div>
                </div>
                {/* Text label on wider screens, a chevron with a 40px hit area on phones. */}
                <button
                  type="button"
                  aria-label={`View event: ${e.actor} ${e.action}${e.target ? " " + e.target : ""}`}
                  className="-mr-2 grid min-h-10 min-w-10 place-items-center self-center rounded-md font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] hover:bg-foreground/[0.04] hover:text-foreground sm:mr-0 sm:min-h-8 sm:px-2"
                >
                  <span aria-hidden className="max-sm:hidden">view</span>
                  <ChevronRightIcon aria-hidden className="size-4 sm:hidden" />
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
