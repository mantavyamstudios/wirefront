// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { ChevronDownIcon, MoonIcon, MusicIcon, PhoneIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Sheet, SheetPopup, SheetTitle, SheetTrigger } from "@wirefront/ui/sheet";

interface Person {
  name: string;
  initials: string;
  status: "online" | "idle" | "dnd" | "offline";
  activity?: string;
  Icon?: typeof PhoneIcon;
}

const ONLINE: Person[] = [
  { name: "Maya Okafor", initials: "MO", status: "online", activity: "Audit log · main", Icon: undefined },
  { name: "Dani Kim", initials: "DK", status: "online", activity: "Figma · design tokens v3" },
  { name: "Mantavyam", initials: "MS", status: "online", activity: "Listening to Bonobo", Icon: MusicIcon },
];

const IDLE: Person[] = [
  { name: "Riya Patel", initials: "RP", status: "idle", activity: "idle 18m" },
  { name: "James Lin", initials: "JL", status: "idle", activity: "idle 7m" },
];

const DND: Person[] = [
  { name: "Olive Berg", initials: "OB", status: "dnd", activity: "in a call · ends 14:30", Icon: PhoneIcon },
];

const OFFLINE: Person[] = [
  { name: "Alex Tran", initials: "AT", status: "offline", activity: "out — Mon 28" },
  { name: "Carlos Mendes", initials: "CM", status: "offline", activity: "off until 09:00 GMT" },
];

const STATUS_DOT: Record<Person["status"], string> = {
  online: "bg-emerald-500",
  idle: "bg-amber-500",
  dnd: "bg-rose-500",
  offline: "bg-muted-foreground/40",
};

// md+: intro card with the presence rail beside it. Phones: the intro card
// gets an "Online now" avatar strip, and the full rail opens in a bottom sheet.
export function ProfilePresenceRailShowcasePage() {
  return (
    <div className="min-h-svh bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-xl border border-border/60 bg-background/40 p-4 sm:p-6">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
            Workspace
          </div>
          <h1 className="mt-1 font-heading text-2xl">Acme studios</h1>
          <p className="mt-2 max-w-prose text-muted-foreground text-sm">
            6 people active right now. Stack on the right shows live presence
            and current focus, including idle and do-not-disturb states. Tap a
            row to peek at what someone's working on.
          </p>

          <Sheet>
            <SheetTrigger className="mt-4 flex w-full items-center gap-3 rounded-lg border border-border/60 bg-background px-3 py-2.5 text-left hover:bg-foreground/[0.02] md:hidden">
              <span className="flex -space-x-2">
                {ONLINE.map((p) => (
                  <Avatar key={p.name} className="size-8 border-2 border-background">
                    <AvatarFallback className="text-[10px]">{p.initials}</AvatarFallback>
                  </Avatar>
                ))}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm">{ONLINE.length} online now</span>
                <span className="block text-muted-foreground text-xs">
                  {IDLE.length} away · {DND.length} do not disturb
                </span>
              </span>
              <ChevronDownIcon className="-rotate-90 size-4 text-muted-foreground" />
            </SheetTrigger>
            <SheetPopup side="bottom" className="max-h-[85svh] pb-[env(safe-area-inset-bottom)]">
              <SheetTitle className="sr-only">Presence</SheetTitle>
              <div className="overflow-y-auto">
                <Rail />
              </div>
            </SheetPopup>
          </Sheet>

          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            <Stat label="Online" value="3" tone="emerald" />
            <Stat label="Idle" value="2" tone="amber" />
            <Stat label="DND" value="1" tone="rose" />
          </div>
        </div>

        <aside className="overflow-hidden rounded-xl border border-border bg-background shadow-sm max-md:hidden md:self-start">
          <Rail />
        </aside>
      </div>
    </div>
  );
}

function Rail() {
  return (
    <>
      <div className="flex items-center justify-between border-border/60 border-b px-4 py-3">
        <div className="font-heading text-sm">Online now</div>
        <button
          type="button"
          aria-haspopup="menu"
          className="-mr-2 inline-flex min-h-8 items-center gap-1 rounded px-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] hover:text-foreground"
        >
          All
          <ChevronDownIcon className="size-3" />
        </button>
      </div>

      <Section label="Online" count={ONLINE.length} people={ONLINE} />
      <Section label="Away" count={IDLE.length} people={IDLE} />
      <Section label="Do not disturb" count={DND.length} people={DND} />
      <Section label="Offline" count={OFFLINE.length} people={OFFLINE} />

      <div className="border-border/60 border-t bg-background px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Avatar className="size-7">
            <AvatarFallback className="text-[10px]">MS</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="text-sm">Mantavyam</div>
            <div className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
              online
            </div>
          </div>
          <button
            type="button"
            aria-label="Set do not disturb"
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground pointer-coarse:size-10"
          >
            <MoonIcon className="size-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}

function Section({
  label,
  count,
  people,
}: {
  label: string;
  count: number;
  people: Person[];
}) {
  return (
    <details open={label !== "Offline"} className="group">
      <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 px-4 py-1.5 hover:bg-foreground/[0.02]">
        <ChevronDownIcon className="size-3 text-muted-foreground transition-transform group-open:rotate-0 -rotate-90" />
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
          {label}
        </span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          {count}
        </span>
      </summary>
      <ul className="border-border/40 border-t">
        {people.map((p) => (
          <li
            key={p.name}
            className="flex items-center gap-2.5 px-4 py-2 transition-colors hover:bg-foreground/[0.02]"
          >
            <div className="relative shrink-0">
              <Avatar
                className={
                  "size-7 " + (p.status === "offline" ? "opacity-60" : "")
                }
              >
                <AvatarFallback className="text-[10px]">
                  {p.initials}
                </AvatarFallback>
              </Avatar>
              <span
                aria-hidden
                className={
                  "absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-background " +
                  STATUS_DOT[p.status]
                }
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm">
                {p.name}
                <span className="sr-only">, {p.status}</span>
              </div>
              {p.activity ? (
                <div className="flex items-center gap-1 truncate text-muted-foreground text-xs">
                  {p.Icon ? <p.Icon className="size-3 shrink-0" /> : null}
                  {p.activity}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "amber" | "rose";
}) {
  const map: Record<typeof tone, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-600 dark:text-rose-400",
  };
  return (
    <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
        {label}
      </div>
      <div className={"mt-1 font-heading text-2xl " + map[tone]}>{value}</div>
    </div>
  );
}
