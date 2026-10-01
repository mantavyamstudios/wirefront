import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@orbit/ui/avatar";

interface Node {
  name: string;
  initials: string;
  title: string;
  team?: string;
  reports?: Node[];
  collapsed?: boolean;
  collapsedCount?: number;
}

const ROOT: Node = {
  name: "Olive Berg",
  initials: "OB",
  title: "CEO",
  reports: [
    {
      name: "Helena Marsh",
      initials: "HM",
      title: "VP Engineering",
      reports: [
        {
          name: "Maya Okafor",
          initials: "MO",
          title: "Eng Manager · Audit",
          team: "4 reports",
          reports: [
            { name: "James Lin", initials: "JL", title: "Senior Engineer · API" },
            { name: "Riya Patel", initials: "RP", title: "Engineer · Billing" },
            { name: "Alex Tran", initials: "AT", title: "Engineer · Front-end" },
          ],
        },
        {
          name: "Carlos Mendes",
          initials: "CM",
          title: "Eng Manager · Platform",
          team: "3 reports",
          collapsed: true,
          collapsedCount: 3,
        },
      ],
    },
    {
      name: "Mia Lloyd",
      initials: "ML",
      title: "VP Design",
      reports: [
        { name: "Dani Kim", initials: "DK", title: "Lead Designer" },
        { name: "Joon Park", initials: "JP", title: "Designer · Brand" },
      ],
    },
    {
      name: "Elena Vargas",
      initials: "EV",
      title: "Head of Sales",
      collapsed: true,
      collapsedCount: 6,
    },
  ],
};

// Which nodes are collapsed, shared by both layouts.
const Collapse = createContext<{
  closed: Set<string>;
  toggle: (name: string) => void;
}>({ closed: new Set(), toggle: () => {} });

// md+: the classic top-down tree in a horizontal scroller. Phones: an indented,
// collapsible outline (no sideways panning to find siblings).
export function ProfileOrgChartShowcasePage() {
  const [closed, setClosed] = useState<Set<string>>(() => new Set());
  // Start the wide tree centred on the root instead of its left edge.
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, []);
  const toggle = (name: string) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  return (
    <Collapse.Provider value={{ closed, toggle }}>
      <div className="min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-5xl">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
            Acme · 28 people · 4 levels deep
          </div>
          <h1 className="mt-1 font-heading text-2xl">Reporting lines</h1>

          <div
            ref={scrollerRef}
            tabIndex={0}
            aria-label="Org chart"
            className="mt-8 overflow-x-auto rounded-xl border border-border/60 bg-background/40 p-8 max-md:hidden"
          >
            <div className="mx-auto w-max">
              <Tree node={ROOT} highlight />
            </div>
          </div>

          <ul role="tree" aria-label="Org chart" className="mt-6 md:hidden">
            <OutlineNode node={ROOT} highlight />
          </ul>
        </div>
      </div>
    </Collapse.Provider>
  );
}

function Tree({ node, highlight = false }: { node: Node; highlight?: boolean }) {
  const { closed } = useContext(Collapse);
  const open = !!node.reports?.length && !closed.has(node.name);
  return (
    <div className="flex flex-col items-center">
      <Card node={node} highlight={highlight} />
      {open ? (
        <>
          {/* Vertical line down */}
          <div className="h-6 w-px bg-border/70" />
          {/* Each child draws its own slice of the horizontal connector, so it
              works for any number of children. */}
          <div className="flex items-start">
            {node.reports!.map((r, i, all) => (
              <div key={r.name} className="relative flex flex-col items-center px-3">
                {all.length > 1 ? (
                  <span
                    aria-hidden
                    className={
                      "absolute top-0 h-px bg-border/70 " +
                      (i === 0 ? "right-0 left-1/2" : i === all.length - 1 ? "right-1/2 left-0" : "inset-x-0")
                    }
                  />
                ) : null}
                {/* short stem */}
                <div className="h-3 w-px bg-border/70" />
                <Tree node={r} />
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function OutlineNode({ node, highlight = false }: { node: Node; highlight?: boolean }) {
  const { closed } = useContext(Collapse);
  const hasReports = !!node.reports?.length;
  const open = hasReports && !closed.has(node.name);
  return (
    <li
      role="treeitem"
      aria-expanded={hasReports ? open : undefined}
      aria-selected={false}
      className="flex flex-col gap-2"
    >
      <Card node={node} highlight={highlight} fluid />
      {open ? (
        <ul role="group" className="ml-4 flex flex-col gap-2 border-border/70 border-l pl-3">
          {node.reports!.map((r) => (
            <OutlineNode key={r.name} node={r} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function Card({
  node,
  highlight,
  fluid = false,
}: {
  node: Node;
  highlight: boolean;
  fluid?: boolean;
}) {
  const { closed, toggle } = useContext(Collapse);
  const hasReports = !!node.reports?.length;
  const open = hasReports && !closed.has(node.name);
  const hidden = node.collapsedCount ?? node.reports?.length ?? 0;
  return (
    <div
      className={
        "flex items-start gap-3 rounded-xl border bg-background px-3 py-2.5 shadow-sm " +
        (fluid ? "w-full " : "w-56 ") +
        (highlight ? "border-foreground/40 ring-2 ring-foreground/15" : "border-border/60")
      }
    >
      <Avatar className="size-9 shrink-0">
        <AvatarFallback className="text-xs">{node.initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{node.name}</div>
        <div className="truncate text-muted-foreground text-xs">
          {node.title}
        </div>
        {node.team ? (
          <div className="mt-1 inline-flex items-center gap-1 rounded bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            {node.team}
          </div>
        ) : null}
      </div>
      {hasReports || node.collapsed ? (
        <button
          type="button"
          onClick={hasReports ? () => toggle(node.name) : undefined}
          aria-expanded={hasReports ? open : false}
          aria-label={`${open ? "Hide" : "Show"} ${hidden} reports of ${node.name}`}
          className="-my-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground pointer-coarse:size-10"
        >
          {open ? (
            <ChevronDownIcon className="size-3.5" />
          ) : (
            <ChevronRightIcon className="size-3.5" />
          )}
        </button>
      ) : null}
    </div>
  );
}
