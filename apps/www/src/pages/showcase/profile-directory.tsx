import { useState } from "react";
import {
  MessageCircleIcon,
  MoreHorizontalIcon,
  PhoneIcon,
  SearchIcon,
  VideoIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@orbit/ui/avatar";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@orbit/ui/menu";

interface Person {
  name: string;
  role: string;
  initials: string;
  email: string;
  status: "online" | "away" | "off";
}

const PEOPLE: Person[] = [
  { name: "Alex Tran", role: "Engineer · Front-end", initials: "AT", email: "alex@acme.dev", status: "off" },
  { name: "Avery Hughes", role: "Recruiter", initials: "AH", email: "avery@acme.dev", status: "online" },
  { name: "Bea Park", role: "Customer Support Lead", initials: "BP", email: "bea@acme.dev", status: "online" },
  { name: "Camille Roy", role: "Counsel", initials: "CR", email: "camille@acme.dev", status: "away" },
  { name: "Carlos Mendes", role: "Engineer · Platform", initials: "CM", email: "carlos@acme.dev", status: "online" },
  { name: "Dani Kim", role: "Lead Designer", initials: "DK", email: "dani@acme.dev", status: "online" },
  { name: "Demarcus Hall", role: "Engineer · Mobile", initials: "DH", email: "dh@acme.dev", status: "off" },
  { name: "Elena Vargas", role: "Head of Sales", initials: "EV", email: "elena@acme.dev", status: "online" },
  { name: "Farah Hassan", role: "Engineer · ML", initials: "FH", email: "farah@acme.dev", status: "away" },
  { name: "James Lin", role: "Senior Engineer · API", initials: "JL", email: "james@acme.dev", status: "online" },
  { name: "Joon Park", role: "Designer · Brand", initials: "JP", email: "joon@acme.dev", status: "online" },
  { name: "Maya Okafor", role: "Staff Engineer", initials: "MO", email: "maya@acme.dev", status: "online" },
  { name: "Nadia Costa", role: "Product Manager", initials: "NC", email: "nadia@acme.dev", status: "away" },
  { name: "Riya Patel", role: "Engineer · Billing", initials: "RP", email: "riya@acme.dev", status: "away" },
  { name: "Mantavyam", role: "Brand", initials: "MS", email: "hello@mantavyam.com", status: "online" },
];

const STATUS_DOT: Record<Person["status"], string> = {
  online: "bg-emerald-500",
  away: "bg-amber-500",
  off: "bg-muted-foreground/40",
};

const ACTIONS = [
  { label: "Message", Icon: MessageCircleIcon },
  { label: "Video call", Icon: VideoIcon },
  { label: "Call", Icon: PhoneIcon },
] as const;

function jumpTo(letter: string) {
  document
    .getElementById(`letter-${letter}`)
    ?.scrollIntoView({ block: "start", behavior: "auto" });
}

// Rows: name + role/email always get the width. Actions show on hover/focus
// for mouse users and collapse to a ⋯ menu on touch. The A–Z rail supports
// press-and-drag scrubbing on touch screens.
export function ProfileDirectoryShowcasePage() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const people = PEOPLE.filter(
    (p) =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.role.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q),
  );

  // Group by first letter of last name
  const groups: Record<string, Person[]> = {};
  people.forEach((p) => {
    const last = p.name.split(" ").slice(-1)[0];
    const k = last[0].toUpperCase();
    (groups[k] ??= []).push(p);
  });
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const scrub = (e: React.PointerEvent) => {
    const el = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest<HTMLElement>("[data-letter]");
    if (el?.dataset.letter && el.dataset.letter in groups) jumpTo(el.dataset.letter);
  };

  return (
    <div className="min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
              Acme directory · {PEOPLE.length} people
            </div>
            <h1 className="mt-1 font-heading text-2xl">Contact directory</h1>
          </div>
          <label className="flex min-h-9 items-center gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-1.5 text-xs focus-within:ring-2 focus-within:ring-ring sm:w-80">
            <SearchIcon className="size-3.5 shrink-0 opacity-60" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Find people"
              placeholder="Find by name, role, or team"
              className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-xs"
            />
            <kbd className="font-mono text-[10px] text-muted-foreground max-sm:hidden pointer-coarse:hidden">
              ⌘K
            </kbd>
          </label>
        </div>

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_24px] gap-2 sm:grid-cols-[minmax(0,1fr)_28px] sm:gap-4">
          {/* overflow-clip (not hidden) keeps the sticky letter headers working. */}
          <div className="overflow-clip rounded-xl border border-border/60 bg-background/40">
            {people.length === 0 ? (
              <p className="px-5 py-10 text-center text-muted-foreground text-sm">
                Nobody matches "{query}".
              </p>
            ) : null}
            {Object.keys(groups)
              .sort()
              .map((letter) => (
                <section key={letter} aria-labelledby={`letter-${letter}`}>
                  <h2
                    id={`letter-${letter}`}
                    className="sticky top-0 z-10 flex scroll-mt-2 items-center gap-3 border-border/40 border-b bg-background px-4 py-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] sm:px-5"
                  >
                    {letter}
                    <span className="h-px flex-1 bg-border/40" />
                    <span>{groups[letter].length}</span>
                  </h2>
                  <ul className="divide-y divide-border/40">
                    {groups[letter].map((p) => (
                      <li
                        key={p.email}
                        className="group grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-foreground/[0.02] sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:px-5"
                      >
                        <div className="relative">
                          <Avatar className="size-9">
                            <AvatarFallback className="text-xs">
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
                        <div className="min-w-0">
                          <div className="truncate text-sm">
                            {p.name}
                            <span className="sr-only">, {p.status === "off" ? "offline" : p.status}</span>
                          </div>
                          <div className="truncate text-muted-foreground text-xs">
                            {p.role}
                            <span className="max-sm:hidden"> · {p.email}</span>
                          </div>
                        </div>
                        {/* Fine pointers: inline actions revealed on row hover or keyboard focus. */}
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-sm:hidden pointer-coarse:hidden">
                          {ACTIONS.map((a) => (
                            <button
                              key={a.label}
                              type="button"
                              aria-label={`${a.label} ${p.name}`}
                              className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
                            >
                              <a.Icon className="size-3.5" />
                            </button>
                          ))}
                        </div>
                        {/* Touch / phones: one ⋯ menu. */}
                        <Menu>
                          <MenuTrigger
                            aria-label={`Actions for ${p.name}`}
                            className="hidden size-10 place-items-center rounded-md text-muted-foreground hover:bg-foreground/[0.05] max-sm:grid pointer-coarse:grid"
                          >
                            <MoreHorizontalIcon className="size-4" />
                          </MenuTrigger>
                          <MenuPopup align="end">
                            {ACTIONS.map((a) => (
                              <MenuItem key={a.label}>
                                <a.Icon />
                                {a.label}
                              </MenuItem>
                            ))}
                          </MenuPopup>
                        </Menu>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
          </div>

          {/* Letter rail */}
          <nav
            aria-label="Jump to letter"
            onPointerDown={(e) => {
              if (e.pointerType === "mouse") return;
              e.currentTarget.setPointerCapture(e.pointerId);
              scrub(e);
            }}
            onPointerMove={(e) => {
              if (e.pointerType !== "mouse" && e.currentTarget.hasPointerCapture(e.pointerId)) scrub(e);
            }}
            className="sticky top-2 flex touch-none select-none flex-col items-center self-start pt-1 font-mono text-[10px]"
          >
            {letters.map((l) => {
              const active = l in groups;
              return (
                <a
                  key={l}
                  href={`#letter-${l}`}
                  data-letter={l}
                  aria-disabled={!active || undefined}
                  tabIndex={active ? undefined : -1}
                  onClick={(e) => {
                    e.preventDefault();
                    if (active) jumpTo(l);
                  }}
                  className={
                    "grid h-5 w-6 place-items-center rounded transition-colors sm:w-5 pointer-coarse:h-[1.375rem] " +
                    (active
                      ? "text-foreground hover:bg-foreground/[0.06]"
                      : "text-muted-foreground/40")
                  }
                >
                  {l}
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
