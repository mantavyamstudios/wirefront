// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import {
  AtSignIcon,
  BellIcon,
  GitPullRequestIcon,
  HeartIcon,
  MessageCircleIcon,
  SettingsIcon,
} from "lucide-react";
import { type ComponentType, useState } from "react";
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";

interface Notif {
  who: string;
  initials: string;
  what: string;
  context?: string;
  time: string;
  Icon: ComponentType<{ className?: string }>;
  unread?: boolean;
}

const TODAY: Notif[] = [
  {
    who: "Maya Okafor",
    initials: "MO",
    what: "mentioned you in",
    context: "Onboarding handbook v3",
    time: "2m",
    Icon: AtSignIcon,
    unread: true,
  },
  {
    who: "James Lin",
    initials: "JL",
    what: "requested your review on",
    context: "PR #128 — audit log",
    time: "18m",
    Icon: GitPullRequestIcon,
    unread: true,
  },
  {
    who: "Riya Patel",
    initials: "RP",
    what: "replied to your comment on",
    context: '"Should we keep the rounded variant?"',
    time: "1h",
    Icon: MessageCircleIcon,
  },
];

const EARLIER: Notif[] = [
  {
    who: "Dani Kim",
    initials: "DK",
    what: "reacted ❤️ to your post in",
    context: "#design-crit",
    time: "Yesterday",
    Icon: HeartIcon,
  },
  {
    who: "Workspace",
    initials: "WS",
    what: "billing settings were updated by",
    context: "Mantavyam",
    time: "2d",
    Icon: SettingsIcon,
  },
  {
    who: "Alex Tran",
    initials: "AT",
    what: "deployed",
    context: "main → production",
    time: "3d",
    Icon: GitPullRequestIcon,
  },
];

type Filter = "all" | "unread" | "mentions";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "mentions", label: "Mentions" },
];

function matches(n: Notif, f: Filter) {
  if (f === "unread") return !!n.unread;
  if (f === "mentions") return n.Icon === AtSignIcon;
  return true;
}

// On phones the notification centre is a full-screen panel (no card chrome);
// from sm up it's the familiar popover-sized card.
export function TimelinesNotificationsShowcasePage() {
  const [filter, setFilter] = useState<Filter>("all");
  const today = TODAY.filter((n) => matches(n, filter));
  const earlier = EARLIER.filter((n) => matches(n, filter));

  return (
    <div className="min-h-svh bg-background sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-md">
        <div className="overflow-hidden bg-background max-sm:min-h-svh sm:rounded-xl sm:border sm:border-border sm:shadow-sm">
          <div className="flex items-center justify-between gap-3 border-border/60 border-b px-4 py-3 max-sm:pt-[max(0.75rem,env(safe-area-inset-top))]">
            <div className="flex items-center gap-2">
              <BellIcon className="size-4 opacity-70" />
              <span className="font-heading text-sm">Notifications</span>
              <span className="rounded-full bg-foreground px-1.5 py-0.5 font-mono text-[10px] text-background">
                2
              </span>
            </div>
            <button
              type="button"
              className="-mr-2 min-h-8 rounded-md px-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] hover:text-foreground pointer-coarse:min-h-10"
            >
              Mark all read
            </button>
          </div>

          <div
            role="group"
            aria-label="Filter notifications"
            className="flex items-center gap-1 border-border/60 border-b px-3 py-2"
          >
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                className="min-h-8 rounded-md px-3 text-muted-foreground text-sm hover:bg-foreground/[0.03] hover:text-foreground aria-pressed:bg-foreground aria-pressed:text-background pointer-coarse:min-h-10 sm:text-xs"
              >
                {f.label}
              </button>
            ))}
          </div>

          {today.length ? (
            <Section label="Today">
              {today.map((n, i) => (
                <Item key={i} n={n} />
              ))}
            </Section>
          ) : null}

          {earlier.length ? (
            <Section label="Earlier">
              {earlier.map((n, i) => (
                <Item key={i} n={n} />
              ))}
            </Section>
          ) : null}

          {!today.length && !earlier.length ? (
            <div className="px-4 py-10 text-center text-muted-foreground text-sm">
              You're all caught up.
            </div>
          ) : null}

          <div className="border-border/60 border-t px-4 py-1 text-center max-sm:pb-[max(0.25rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              className="min-h-10 px-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] hover:text-foreground"
            >
              See all activity →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="bg-background px-4 py-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
        {label}
      </div>
      <ul className="divide-y divide-border/40">{children}</ul>
    </div>
  );
}

function Item({ n }: { n: Notif }) {
  return (
    <li
      className={
        "relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-foreground/[0.02] " +
        (n.unread ? "bg-foreground/[0.015]" : "")
      }
    >
      {n.unread ? (
        <span aria-hidden className="absolute top-4 left-1.5 size-1.5 rounded-full bg-blue-500" />
      ) : null}
      <div className="relative shrink-0">
        <Avatar className="size-9">
          <AvatarFallback className="text-[11px]">
            {n.initials}
          </AvatarFallback>
        </Avatar>
        <span aria-hidden className="absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full bg-background">
          <span className="grid size-3.5 place-items-center rounded-full bg-foreground text-background">
            <n.Icon className="size-2" />
          </span>
        </span>
      </div>
      <div className="min-w-0 flex-1 leading-snug">
        <div className="break-words text-sm">
          {n.unread ? <span className="sr-only">Unread: </span> : null}
          <span className="font-medium">{n.who}</span>{" "}
          <span className="text-muted-foreground">{n.what}</span>{" "}
          {n.context ? (
            <span className="text-foreground/85">{n.context}</span>
          ) : null}
        </div>
        <div className="mt-0.5 font-mono text-[10px] text-muted-foreground/80 uppercase tracking-[0.2em]">
          {n.time}
        </div>
      </div>
    </li>
  );
}
