import { Fragment, useState } from "react";
import { CornerDownLeftIcon } from "lucide-react";

interface Member {
  initials: string;
  tone: string;
  name: string;
  handle: string;
  team: string;
  active?: boolean;
}

const MEMBERS: Member[] = [
  {
    initials: "MO",
    tone: "bg-emerald-500/85 text-white",
    name: "Maya Okafor",
    handle: "maya",
    team: "Engineering",
  },
  {
    initials: "JL",
    tone: "bg-amber-500/85 text-white",
    name: "James Lin",
    handle: "james",
    team: "Engineering",
    active: true,
  },
  {
    initials: "RP",
    tone: "bg-violet-500/85 text-white",
    name: "Riya Patel",
    handle: "riya",
    team: "Product",
  },
  {
    initials: "DK",
    tone: "bg-sky-500/85 text-white",
    name: "Dani Kim",
    handle: "dani",
    team: "Design",
  },
  {
    initials: "AT",
    tone: "bg-rose-500/85 text-white",
    name: "Alex Tran",
    handle: "alex",
    team: "Marketing",
  },
];

const GROUPS = [
  { handle: "engineering", description: "5 people · Engineering team" },
  { handle: "design", description: "3 people · Design team" },
];

type Option =
  | { id: string; kind: "person"; m: Member }
  | { id: string; kind: "group"; g: (typeof GROUPS)[number] };

// A working mention combobox: typing "@…" at the end of the reply filters
// people and groups. ↑/↓/Enter/Esc on a keyboard, tap on touch. Phones get the
// suggestions docked full-width under the composer; sm+ a 20rem popover.
export function ThreadsMentionPopoverShowcasePage() {
  const [value, setValue] = useState(
    "Hey @james — what do you think? Also @jam",
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const match = /@(\w*)$/.exec(value);
  const query = match?.[1]?.toLowerCase() ?? null;
  const people =
    query == null
      ? []
      : MEMBERS.filter(
          (m) =>
            m.handle.startsWith(query) || m.name.toLowerCase().includes(query),
        );
  const groups =
    query == null ? [] : GROUPS.filter((g) => g.handle.startsWith(query));
  const options: Option[] = [
    ...people.map((m) => ({
      id: `person-${m.handle}`,
      kind: "person" as const,
      m,
    })),
    ...groups.map((g) => ({
      id: `group-${g.handle}`,
      kind: "group" as const,
      g,
    })),
  ];
  const open = query != null && !dismissed && options.length > 0;
  const active = Math.min(activeIdx, Math.max(options.length - 1, 0));

  const insert = (o: Option) => {
    const handle = o.kind === "person" ? o.m.handle : o.g.handle;
    setValue((v) => v.replace(/@\w*$/, `@${handle} `));
    setActiveIdx(0);
  };

  const optionClass = (i: number) =>
    `flex w-full items-center gap-3 px-3 py-2 text-left transition-colors pointer-coarse:py-2.5 ${
      i === active ? "bg-foreground/[0.06]" : "hover:bg-foreground/[0.03]"
    }`;

  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-24">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          Composer
        </div>
        <h1 className="mt-1 font-heading text-2xl sm:text-3xl">
          Mention popover
        </h1>

        <div className="relative mt-8 rounded-lg border border-border/60 bg-background/40 p-3 sm:mt-10 sm:p-4">
          <label
            htmlFor="mention-input"
            className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]"
          >
            Reply to thread
          </label>
          <textarea
            id="mention-input"
            role="combobox"
            aria-expanded={open}
            aria-controls="mention-listbox"
            aria-autocomplete="list"
            aria-activedescendant={open ? options[active]?.id : undefined}
            rows={3}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setDismissed(false);
              setActiveIdx(0);
            }}
            onKeyDown={(e) => {
              if (!open) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIdx((i) => (i + 1) % options.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIdx((i) => (i - 1 + options.length) % options.length);
              } else if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                insert(options[active]!);
              } else if (e.key === "Escape") {
                setDismissed(true);
              }
            }}
            className="mt-2 block w-full resize-none rounded-md border border-input bg-background px-3 py-2.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
          />

          {open ? (
            <div className="z-30 mt-2 overflow-hidden rounded-xl border border-border/70 bg-background shadow-2xl sm:absolute sm:top-full sm:left-4 sm:mt-1 sm:w-80">
              <ul
                id="mention-listbox"
                role="listbox"
                aria-label="Mention suggestions"
                className="max-h-[40svh] overflow-y-auto"
              >
                {people.length ? (
                  <li
                    role="presentation"
                    className="px-3 py-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]"
                  >
                    People
                  </li>
                ) : null}
                {options.map((o, i) =>
                  o.kind === "person" ? (
                    <li
                      key={o.id}
                      id={o.id}
                      role="option"
                      aria-selected={i === active}
                      onPointerEnter={(e) =>
                        e.pointerType === "mouse" && setActiveIdx(i)
                      }
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insert(o)}
                      className={optionClass(i) + " cursor-pointer"}
                    >
                      <div
                        aria-hidden
                        className={`flex size-7 shrink-0 items-center justify-center rounded-full font-medium text-[11px] ${o.m.tone}`}
                      >
                        {o.m.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate font-medium text-sm">
                            {o.m.name}
                          </span>
                          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                            @{o.m.handle}
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.2em]">
                          {o.m.team}
                        </div>
                      </div>
                      {i === active ? (
                        <CornerDownLeftIcon
                          aria-hidden
                          className="size-3.5 opacity-60 pointer-coarse:hidden"
                        />
                      ) : null}
                    </li>
                  ) : (
                    <Fragment key={o.id}>
                      {i === people.length ? (
                        <li
                          role="presentation"
                          className="border-border/60 border-t px-3 py-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]"
                        >
                          Groups
                        </li>
                      ) : null}
                      <li
                        id={o.id}
                        role="option"
                        aria-selected={i === active}
                        onPointerEnter={(e) =>
                          e.pointerType === "mouse" && setActiveIdx(i)
                        }
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => insert(o)}
                        className={optionClass(i) + " cursor-pointer"}
                      >
                        <span
                          aria-hidden
                          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground/[0.08] font-mono text-[11px]"
                        >
                          #
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm">
                            @{o.g.handle}
                          </div>
                          <div className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.2em]">
                            {o.g.description}
                          </div>
                        </div>
                      </li>
                    </Fragment>
                  ),
                )}
              </ul>

              <div className="flex items-center justify-between gap-3 border-border/60 border-t bg-foreground/[0.02] px-3 py-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] pointer-coarse:hidden">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border/60 bg-background/80 px-1 normal-case">
                    ↑
                  </kbd>
                  <kbd className="rounded border border-border/60 bg-background/80 px-1 normal-case">
                    ↓
                  </kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border/60 bg-background/80 px-1 normal-case">
                    ↵
                  </kbd>
                  insert
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
