// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRightIcon,
  CornerDownLeftIcon,
  LayoutGridIcon,
  Rows3Icon,
  SearchIcon,
  ShuffleIcon,
} from "lucide-react";
import { AmbientGrain } from "@wirefront/ui/ambient-grain";
import {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandEmpty,
  CommandFooter,
  CommandInput,
  CommandItem,
  CommandList,
} from "@wirefront/ui/command";
import { ThemeToggle } from "@wirefront/ui/theme-toggle";
import { MantavyamMark } from "@/components/mantavyam-mark";
import { LINKS } from "@/lib/site";
import {
  CATEGORIES,
  type Category,
  type Design,
  type DesignStatus,
} from "@/lib/designs";
import { getShowcase } from "@/pages/showcase/registry";

interface DesignEntry {
  category: Category;
  design: Design;
}

type Density = "grid" | "stack";

export function LandingPage() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [density, setDensity] = useState<Density>("grid");
  const navigate = useNavigate();

  const allEntries = useMemo<DesignEntry[]>(
    () =>
      CATEGORIES.flatMap((c) =>
        c.designs
          .filter((d) => !!getShowcase(c.slug, d.slug))
          .map((d) => ({ category: c, design: d })),
      ),
    [],
  );
  const totalFiles = allEntries.length;

  // Dev-mode drift check: warn if anything in designs.ts isn't wired into the
  // registry, or vice versa. Helps catch missing imports before they ship as
  // dead links in the palette.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const orphans: string[] = [];
    for (const c of CATEGORIES) {
      for (const d of c.designs) {
        if (!getShowcase(c.slug, d.slug)) {
          orphans.push(`design "${c.slug}/${d.slug}" listed in designs.ts but not in registry.tsx`);
        }
      }
    }
    if (orphans.length > 0) {
      console.warn(`[landing] ${orphans.length} design(s) missing from registry:`, orphans);
    }
  }, []);

  // Global ⌘K + ? shortcuts.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      // / focuses search when not in another input.
      if (e.key === "/" && !paletteOpen && !isTypingTarget()) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [paletteOpen]);

  const goRandom = () => {
    const usable = allEntries.filter((e) =>
      getShowcase(e.category.slug, e.design.slug),
    );
    if (usable.length === 0) return;
    const pick = usable[Math.floor(Math.random() * usable.length)]!;
    navigate({
      to: "/c/$category/$design",
      params: { category: pick.category.slug, design: pick.design.slug },
    });
  };

  return (
    <div className="relative min-h-svh bg-background font-mono text-foreground">
      <AmbientGrain />

      <header className="relative z-30 border-border/60 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-6 md:px-10">
          <div className="flex items-center gap-2 text-sm">
            <a
              aria-label="Mantavyam Studios"
              className="inline-flex text-foreground transition-opacity hover:opacity-70"
              href={LINKS.website}
              rel="noreferrer"
              target="_blank"
              title="Mantavyam Studios"
            >
              <MantavyamMark className="h-3.5 w-auto" />
            </a>
            <span className="tracking-[0.2em] uppercase">
              Wirefront
            </span>
            <span className="ml-3 hidden font-mono text-[10px] text-muted-foreground tracking-[0.2em] sm:inline">
              {totalFiles.toString().padStart(2, "0")} FILES ·{" "}
              {CATEGORIES.length.toString().padStart(2, "0")} FOLDERS
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <DensityToggle value={density} onChange={setDensity} />
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 rounded-md border border-border/70 bg-background/40 px-2.5 py-1.5 text-muted-foreground text-xs transition-colors hover:text-foreground"
            >
              <SearchIcon className="size-3.5" />
              <span className="hidden sm:inline">Search…</span>
              <kbd className="rounded border border-border/60 bg-background/80 px-1 py-0.5 font-mono text-[9px]">
                ⌘K
              </kbd>
            </button>
            <button
              type="button"
              onClick={goRandom}
              aria-label="Random design"
              title="Random design"
              className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
            >
              <ShuffleIcon className="size-4" />
            </button>
            <a
              href={LINKS.repo}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub repository"
              title="GitHub"
              className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
            >
              <GithubMark className="size-4" />
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-[1600px] px-6 pt-12 pb-8 md:px-10 md:pt-16">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          Folder
        </div>
        <h1 className="mt-2 font-heading text-4xl tracking-tight md:text-5xl">
          Designs.
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground text-sm leading-relaxed">
          {totalFiles} screen designs, built on coss-ui —
          with raw CSS, shaders, weird SVGs, and the odd canvas thrown in.
          Scroll, or press{" "}
          <kbd className="rounded border border-border/60 bg-background/80 px-1 py-0.5 font-mono text-[10px]">⌘K</kbd>{" "}
          to jump in.
        </p>
      </section>

      <div className="relative z-10 border-border/60 border-t bg-foreground/[0.02] pt-2 pb-24">
        <main className="mx-auto max-w-[1600px] px-6 md:px-10">
          {CATEGORIES.map((c) => (
            <CategorySection key={c.slug} category={c} density={density} />
          ))}
        </main>
      </div>

      <LandingPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        entries={allEntries}
      />

    </div>
  );
}

function CategorySection({
  category,
  density,
}: {
  category: Category;
  density: Density;
}) {
  if (category.designs.length === 0) return null;
  const Icon = category.Icon;
  return (
    <section className="mt-20 first:mt-4">
      <div className="-mx-6 mb-8 border-border/60 border-t md:-mx-10" aria-hidden />
      <header className="flex items-center gap-3.5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-foreground/[0.04] p-2 dark:bg-white/[0.04]">
          <Icon className="h-full w-full text-foreground/85" />
        </div>
        <div>
          <h2 className="font-heading text-foreground text-2xl tracking-tight md:text-3xl">
            {category.title}
          </h2>
          <p className="mt-1 max-w-xl text-muted-foreground text-xs leading-relaxed">
            {category.blurb}{" "}
            <span className="font-mono text-muted-foreground/70 tracking-[0.2em]">
              · {category.designs.length.toString().padStart(2, "0")} files
            </span>
          </p>
        </div>
      </header>

      <ul
        className={
          density === "stack"
            ? "mt-7 grid grid-cols-1 gap-y-12"
            : "mt-7 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
        }
      >
        {category.designs.map((d) => (
          <DesignTile
            key={d.slug}
            category={category}
            design={d}
            density={density}
          />
        ))}
      </ul>
    </section>
  );
}

function DesignTile({
  category,
  design,
  density,
}: {
  category: Category;
  design: Design;
  density: Density;
}) {
  const hasShowcase = !!getShowcase(category.slug, design.slug);
  if (density === "stack") {
    return (
      <li>
        <Link
          to="/c/$category/$design"
          params={{ category: category.slug, design: design.slug }}
          className="group grid grid-cols-1 items-start gap-6 focus-visible:outline-none lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-8"
        >
          <Thumbnail
            category={category.slug}
            design={design.slug}
            Fallback={category.Icon}
            iconOnly={!hasShowcase}
          />
          <div className="px-1 lg:sticky lg:top-20 lg:self-start lg:px-0 lg:pt-2">
            <div className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.25em]">
              {category.title}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <h3 className="font-heading text-foreground text-2xl tracking-tight">
                {design.title}
              </h3>
              {design.status && <StatusBadge status={design.status} />}
            </div>
            <div className="mt-1 font-mono text-[11px] text-muted-foreground tracking-[0.05em]">
              {design.slug}.tsx
            </div>
            <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
              {design.blurb}
            </p>
            <div className="mt-5 inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] transition-colors group-hover:text-foreground">
              Open
              <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </Link>
      </li>
    );
  }
  return (
    <li>
      <Link
        to="/c/$category/$design"
        params={{ category: category.slug, design: design.slug }}
        className="group block focus-visible:outline-none"
      >
        <Thumbnail
          category={category.slug}
          design={design.slug}
          Fallback={category.Icon}
          iconOnly={!hasShowcase}
        />
        <div className="mt-3 px-0.5">
          <div className="flex items-center gap-1.5">
            <div className="min-w-0 flex-1 truncate font-heading text-foreground text-sm">
              {design.title}
            </div>
            {design.status && <StatusBadge status={design.status} />}
          </div>
          <div className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground tracking-[0.05em]">
            {design.slug}.tsx
          </div>
        </div>
      </Link>
    </li>
  );
}

function StatusBadge({ status }: { status: DesignStatus }) {
  const cls =
    status === "new"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      : "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] ${cls}`}
    >
      {status}
    </span>
  );
}

function Thumbnail({
  category,
  design,
  Fallback,
  iconOnly,
}: {
  category: string;
  design: string;
  Fallback: ComponentType<{ className?: string }>;
  iconOnly?: boolean;
}) {
  const [lightFailed, setLightFailed] = useState(false);
  const [darkFailed, setDarkFailed] = useState(false);
  const lightSrc = `/previews/${category}__${design}--light.png`;
  const darkSrc = `/previews/${category}__${design}--dark.png`;
  const showLight = !iconOnly && !lightFailed;
  const showDark = !iconOnly && !darkFailed;
  const showFallback = iconOnly || (lightFailed && darkFailed);

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-border bg-background shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_-12px_rgba(0,0,0,0.18)] transition-[transform,box-shadow,border-color] group-hover:-translate-y-1 group-hover:border-foreground/40 group-hover:shadow-[0_2px_4px_rgba(0,0,0,0.08),0_16px_32px_-12px_rgba(0,0,0,0.28)] dark:bg-white/[0.06] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.6)] dark:group-hover:shadow-[0_2px_4px_rgba(0,0,0,0.5),0_16px_32px_-12px_rgba(0,0,0,0.7)]">
      {showLight ? (
        <img
          src={lightSrc}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setLightFailed(true)}
          className="absolute inset-0 block h-full w-full object-cover object-top dark:hidden"
          /* see Thumbnail comment for the brightness rationale */
        />
      ) : null}
      {showDark ? (
        <img
          src={darkSrc}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setDarkFailed(true)}
          /* +5% brightness on dark snapshots only — keeps in-theme fidelity
             while preventing the dark UI from reading as a void at thumb size. */
          className="absolute inset-0 hidden h-full w-full object-cover object-top dark:block dark:brightness-105"
        />
      ) : null}
      {showFallback ? (
        <div className="absolute inset-0 flex items-center justify-center p-5">
          <Fallback className="h-full w-full text-foreground/55" />
        </div>
      ) : null}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-foreground/[0.08] ring-inset dark:ring-white/[0.08]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent dark:via-white/15"
      />
    </div>
  );
}

interface PaletteItem {
  value: string;
  label: string;
  title: string;
  category: string;
  categorySlug: string;
  designSlug: string;
}

function LandingPalette({
  open,
  onOpenChange,
  entries,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  entries: DesignEntry[];
}) {
  const navigate = useNavigate();

  const items = useMemo<PaletteItem[]>(
    () =>
      entries.map((e) => ({
        value: `${e.category.slug}/${e.design.slug}`,
        // Base UI Autocomplete filters by `label` substring — concat every
        // searchable term so typing the title, slug, category, or any word
        // from the blurb narrows in.
        label: `${e.design.title} ${e.design.slug} ${e.category.title} ${e.design.blurb}`,
        title: e.design.title,
        category: e.category.title,
        categorySlug: e.category.slug,
        designSlug: e.design.slug,
      })),
    [entries],
  );

  const handleSelect = (categorySlug: string, designSlug: string) => {
    onOpenChange(false);
    navigate({
      to: "/c/$category/$design",
      params: { category: categorySlug, design: designSlug },
    });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandDialogPopup className="!max-w-2xl">
        <Command items={items}>
          <CommandInput placeholder="Search every design… (try 'login', 'pricing', 'kanban')" />
          <CommandList className="max-h-[480px]">
            <CommandEmpty>No matches.</CommandEmpty>
            <CommandCollection>
              {(it: PaletteItem) => (
                <CommandItem
                  key={it.value}
                  value={it.value}
                  onClick={() => handleSelect(it.categorySlug, it.designSlug)}
                >
                  <span className="flex-1 truncate">{it.title}</span>
                  <span className="ml-2 hidden text-muted-foreground/70 text-xs sm:inline">
                    {it.category}
                  </span>
                  <span className="ml-2 hidden font-mono text-[10px] text-muted-foreground/50 sm:inline">
                    {it.designSlug}.tsx
                  </span>
                </CommandItem>
              )}
            </CommandCollection>
          </CommandList>
          <CommandFooter>
            <span className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-border/60 bg-background/80 px-1 py-0.5 normal-case">
                  ↑
                </kbd>
                <kbd className="rounded border border-border/60 bg-background/80 px-1 py-0.5 normal-case">
                  ↓
                </kbd>
                navigate
              </span>
              <span className="flex items-center gap-1.5">
                <CornerDownLeftIcon className="size-3" />
                open
              </span>
              <span className="ml-auto">{items.length} files</span>
            </span>
          </CommandFooter>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  );
}

function DensityToggle({
  value,
  onChange,
}: {
  value: Density;
  onChange: (v: Density) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Layout"
      className="inline-flex items-center rounded-md border border-border/70 bg-background/40 p-0.5"
    >
      <button
        type="button"
        aria-label="Grid view"
        aria-pressed={value === "grid"}
        onClick={() => onChange("grid")}
        className={`inline-flex size-7 items-center justify-center rounded transition-colors ${
          value === "grid"
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <LayoutGridIcon className="size-3.5" />
      </button>
      <button
        type="button"
        aria-label="Stack view"
        aria-pressed={value === "stack"}
        onClick={() => onChange("stack")}
        className={`inline-flex size-7 items-center justify-center rounded transition-colors ${
          value === "stack"
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Rows3Icon className="size-3.5" />
      </button>
    </div>
  );
}

function GithubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.18c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.05 11.05 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.76.11 3.05.74.8 1.18 1.83 1.18 3.09 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.13v3.16c0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

function isTypingTarget(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return true;
  return el.isContentEditable;
}
