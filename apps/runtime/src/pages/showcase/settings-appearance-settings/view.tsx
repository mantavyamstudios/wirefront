// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `appearance-settings`).
"use client";

import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import {
  CheckIcon,
  FileTextIcon,
  FolderIcon,
  InboxIcon,
  ListTodoIcon,
  MoonIcon,
  PlusIcon,
  SearchIcon,
  SunIcon,
} from "lucide-react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { cn } from "@wirefront/ui/lib/utils";
import { Button } from "@wirefront/ui/button";
import { Slider } from "@wirefront/ui/slider";
import { Switch } from "@wirefront/ui/switch";
import { Skeleton } from "@wirefront/ui/skeleton";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import type { PreviewTask, ThemePrefs } from "./schema";

type ThemeChoice = ThemePrefs["theme"];
type Density = ThemePrefs["density"];
type AccentName = ThemePrefs["accent"];

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("themeSettings.<key>"). */
export const THEME_SETTINGS_MESSAGES = {
  title: "Appearance",
  subtitle: "Customise how {workspace} looks on this device.",
  saving: "Saving…",
  saved: "Saved",
  reset: "Reset",
  theme: "Theme",
  themeSystemLight: "Follows your device setting, currently light.",
  themeSystemDark: "Follows your device setting, currently dark.",
  themeHint: "Pick a theme, or follow your device setting.",
  system: "System",
  light: "Light",
  dark: "Dark",
  previewCaption: "Preview. Tick a task to try it.",
  previewMeta: "{scheme} · {size}px",
  accent: "Accent colour",
  accentHint: "Used for buttons, links and highlights.",
  indigo: "Indigo",
  violet: "Violet",
  rose: "Rose",
  orange: "Orange",
  emerald: "Emerald",
  sky: "Sky",
  layout: "Layout",
  layoutHint: "Spacing and type across lists, tables and the sidebar.",
  density: "Density",
  densityHint: "How much room rows and lists get.",
  compact: "Compact",
  default: "Default",
  comfortable: "Comfortable",
  fontSize: "Font size",
  fontSizeHint: "Scales text everywhere in the app.",
  fontSizeValue: "{size}px",
  sampleText: "Release notes are ready for review.",
  accessibility: "Accessibility",
  accessibilityHint: "Fine-tune motion and navigation.",
  reduceMotion: "Reduce motion",
  reduceMotionHint: "Replace slides and springs with simple fades.",
  reduceMotionOs: "Your device already asks for less motion, so this is on.",
  sidebarIcons: "Show sidebar icons",
  sidebarIconsHint: "Show icons next to items in the sidebar.",
  previewSearch: "Search {workspace}",
  previewInbox: "Inbox",
  previewTasks: "My tasks",
  previewProjects: "Projects",
  previewDocs: "Docs",
  previewProject: "Launch plan",
  previewDone: "{done} of {total} done",
  previewNewTask: "New task",
  previewList: "List",
  previewBoard: "Board",
  previewTimeline: "Timeline",
  previewComplete: "Complete “{title}” in the preview",
  previewReopen: "Reopen “{title}” in the preview",
  errorTitle: "Couldn’t load appearance settings",
  retry: "Try again",
};

export interface ThemeSettingsProps {
  /** The saved preferences. Leave it out while they load. */
  prefs?: ThemePrefs;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Save after every change. The choice shows at once and reverts if this fails. Choices are read-only without it. */
  onSave?: Action<ThemePrefs>;
  /** What "Reset" goes back to. Hidden when not given. */
  defaults?: ThemePrefs;
  /** Your product's name, used in the copy and the preview. */
  workspace: string;
  /** Sample rows for the live preview. */
  previewTasks: PreviewTask[];
  className?: string;
}

const easeOut = [0.23, 1, 0.32, 1] as const;
const spring = { type: "spring", stiffness: 520, damping: 40 } as const;
const press =
  "transition-[background-color,color,box-shadow,scale] duration-150 ease-out motion-safe:active:scale-[0.97]";
const textSizes = [12, 13, 14, 15, 16, 17, 18];
const tintTransition =
  "transition-[background-color,color,border-color] duration-300 ease-out";

const accents: Record<
  AccentName,
  {
    swatch: string;
    light: { solid: string; ink: string };
    dark: { solid: string; ink: string };
  }
> = {
  indigo: {
    swatch: "bg-category-8-strong",
    light: { solid: "var(--category-8)", ink: "var(--category-8-strong)" },
    dark: { solid: "var(--category-8)", ink: "var(--category-8)" },
  },
  violet: {
    swatch: "bg-category-5-strong",
    light: { solid: "var(--category-5)", ink: "var(--category-5-strong)" },
    dark: { solid: "var(--category-5)", ink: "var(--category-5)" },
  },
  rose: {
    swatch: "bg-category-4-strong",
    light: { solid: "var(--category-4)", ink: "var(--category-4-strong)" },
    dark: { solid: "var(--category-4)", ink: "var(--category-4)" },
  },
  orange: {
    swatch: "bg-category-7-strong",
    light: { solid: "var(--category-7)", ink: "var(--category-7-strong)" },
    dark: { solid: "var(--category-7)", ink: "var(--category-7)" },
  },
  emerald: {
    swatch: "bg-category-2-strong",
    light: { solid: "var(--category-2)", ink: "var(--category-2-strong)" },
    dark: { solid: "var(--category-2)", ink: "var(--category-2)" },
  },
  sky: {
    swatch: "bg-category-1-strong",
    light: { solid: "var(--category-1)", ink: "var(--category-1-strong)" },
    dark: { solid: "var(--category-1)", ink: "var(--category-1)" },
  },
};

const lightScope = {
  "--background": "var(--color-white)",
  "--foreground": "var(--color-neutral-800)",
  "--card": "var(--color-white)",
  "--card-foreground": "var(--color-neutral-800)",
  "--muted": "color-mix(in srgb, var(--color-black) 4%, transparent)",
  "--muted-foreground":
    "color-mix(in srgb, var(--color-neutral-500) 90%, var(--color-black))",
  "--accent": "color-mix(in srgb, var(--color-black) 4%, transparent)",
  "--border": "color-mix(in srgb, var(--color-black) 8%, transparent)",
  "--input": "color-mix(in srgb, var(--color-black) 10%, transparent)",
  "--primary": "var(--color-neutral-800)",
  "--primary-foreground": "var(--color-neutral-50)",
} as CSSProperties;

const THEME_ORDER: ThemeChoice[] = ["system", "light", "dark"];
const DENSITY_ORDER: Density[] = ["compact", "default", "comfortable"];
const ACCENT_ORDER: AccentName[] = [
  "indigo",
  "violet",
  "rose",
  "orange",
  "emerald",
  "sky",
];
const ownerHues = [
  "bg-category-6-strong text-white",
  "bg-category-3-strong text-white",
  "bg-category-5-strong text-white",
  "bg-category-1-strong text-white",
  "bg-category-2-strong text-white",
];

const densityRow: Record<Density, string> = {
  compact: "py-[0.35em]",
  default: "py-[0.55em]",
  comfortable: "py-[0.8em]",
};

const densityNav: Record<Density, string> = {
  compact: "py-[0.25em]",
  default: "py-[0.38em]",
  comfortable: "py-[0.52em]",
};

function useReducedMotionSafe() {
  const prefers = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && Boolean(prefers);
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function samePrefs(a: ThemePrefs, b: ThemePrefs) {
  return (Object.keys(a) as (keyof ThemePrefs)[]).every((k) => a[k] === b[k]);
}

function tintStyle(theme: "light" | "dark", accent: AccentName): CSSProperties {
  const tint = accents[accent][theme];
  return {
    ...(theme === "light" ? lightScope : {}),
    "--tint": tint.solid,
    "--tint-ink": tint.ink,
  } as CSSProperties;
}

function MiniApp({
  theme,
  prefs,
  tasks,
  onToggleTask,
  workspace,
}: {
  theme: "light" | "dark";
  prefs: ThemePrefs;
  tasks: PreviewTask[];
  onToggleTask: (id: string) => void;
  workspace: string;
}) {
  const t = useMessages("themeSettings", THEME_SETTINGS_MESSAGES);
  const done = tasks.filter((task) => task.done).length;
  const owners = [...new Set(tasks.map((t) => t.owner))];
  return (
    <div
      className={cn(
        "@container/app flex size-full flex-col overflow-hidden bg-background text-foreground leading-normal",
        theme === "dark" && "dark"
      )}
      style={{
        ...tintStyle(theme, prefs.accent),
        fontSize: `${prefs.textSize * 0.86}px`,
      }}
    >
      <div className="flex h-[2.5em] shrink-0 items-center gap-[0.6em] border-b px-[0.9em]">
        <span className="flex gap-[0.35em]">
          <span className="size-[0.55em] rounded-full bg-foreground/16" />
          <span className="size-[0.55em] rounded-full bg-foreground/16" />
          <span className="size-[0.55em] rounded-full bg-foreground/16" />
        </span>
        <span className="mx-auto flex h-[1.75em] w-full max-w-[18em] items-center gap-[0.4em] rounded-[calc(var(--radius)*0.5)] bg-muted px-[0.6em] text-[0.8em] text-muted-foreground">
          <SearchIcon className="size-[1.1em]" />
          {interpolate(t.previewSearch, { workspace })}
        </span>
        <span className="flex size-[1.6em] items-center justify-center text-muted-foreground">
          {theme === "dark" ? (
            <MoonIcon className="size-[1em]" />
          ) : (
            <SunIcon className="size-[1em]" />
          )}
        </span>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-[12em] shrink-0 flex-col gap-[0.15em] border-e bg-muted/50 p-[0.6em] @lg/app:flex">
          <div className="mb-[0.4em] flex items-center gap-[0.5em] px-[0.4em] pt-[0.2em]">
            <span
              className={cn(
                "flex size-[1.5em] items-center justify-center rounded-[calc(var(--radius)*0.4)] bg-(--tint) font-semibold text-[0.85em] text-white",
                tintTransition
              )}
            >
              {workspace[0]}
            </span>
            <span className="truncate font-semibold text-[0.9em]">
              {workspace}
            </span>
          </div>
          {[
            { label: t.previewInbox, icon: <InboxIcon />, count: 4 },
            { label: t.previewTasks, icon: <ListTodoIcon />, active: true },
            { label: t.previewProjects, icon: <FolderIcon /> },
            { label: t.previewDocs, icon: <FileTextIcon /> },
          ].map((item) => (
            <span
              className={cn(
                "flex items-center gap-[0.55em] rounded-[calc(var(--radius)*0.5)] px-[0.5em] text-[0.88em] [&_svg]:size-[1.05em] [&_svg]:shrink-0",
                densityNav[prefs.density],
                item.active
                  ? "bg-[color-mix(in_srgb,var(--tint)_14%,transparent)] font-medium text-(--tint-ink)"
                  : "text-muted-foreground",
                tintTransition
              )}
              key={item.label}
            >
              {prefs.sidebarIcons && item.icon}
              {item.label}
              {item.count && (
                <span
                  className={cn(
                    "ms-auto rounded-full bg-(--tint) px-[0.45em] font-medium text-[0.78em] text-white tabular-nums",
                    tintTransition
                  )}
                >
                  {item.count}
                </span>
              )}
            </span>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-col gap-[0.6em] border-b px-[1em] pt-[0.9em]">
            <div className="flex items-center gap-[0.6em]">
              <span className="truncate font-semibold text-[1.1em] tracking-tight">
                {t.previewProject}
              </span>
              <span className="hidden shrink-0 text-[0.8em] text-muted-foreground tabular-nums @sm/app:inline">
                {interpolate(t.previewDone, { done, total: tasks.length })}
              </span>
              <span
                className={cn(
                  "ms-auto inline-flex shrink-0 items-center gap-[0.3em] rounded-[calc(var(--radius)*0.5)] bg-(--tint) px-[0.7em] py-[0.3em] font-medium text-[0.82em] text-white",
                  tintTransition
                )}
              >
                <PlusIcon className="size-[1.05em]" />
                {t.previewNewTask}
              </span>
            </div>
            <div className="h-[0.28em] overflow-hidden rounded-full bg-muted">
              <motion.div
                animate={{ scaleX: tasks.length ? done / tasks.length : 0 }}
                className={cn(
                  "h-full origin-left rounded-full bg-(--tint)",
                  tintTransition
                )}
                initial={false}
                transition={spring}
              />
            </div>
            <div className="flex gap-[1.2em] text-[0.85em]">
              {[t.previewList, t.previewBoard, t.previewTimeline].map(
                (tab, i) => (
                  <span
                    className={cn(
                      "relative pb-[0.55em]",
                      i === 0
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    )}
                    key={tab}
                  >
                    {tab}
                    {i === 0 && (
                      <span
                        className={cn(
                          "absolute inset-x-0 -bottom-px h-[0.14em] rounded-full bg-(--tint)",
                          tintTransition
                        )}
                      />
                    )}
                  </span>
                )
              )}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden px-[0.5em] py-[0.3em]">
            {tasks.map((task) => (
              <motion.div
                className={cn(
                  "flex items-center gap-[0.7em] rounded-[calc(var(--radius)*0.5)] px-[0.6em] transition-[padding] duration-200 ease-out",
                  densityRow[prefs.density]
                )}
                key={task.id}
                layout="position"
                layoutDependency={prefs.density}
                transition={spring}
              >
                <button
                  aria-label={interpolate(
                    task.done ? t.previewReopen : t.previewComplete,
                    { title: task.title }
                  )}
                  aria-pressed={Boolean(task.done)}
                  className={cn(
                    "relative flex size-[1.15em] shrink-0 items-center justify-center rounded-[calc(var(--radius)*0.4)] border outline-none ring-(--tint)/40 focus-visible:ring-[3px]",
                    task.done
                      ? "border-transparent bg-(--tint) text-white"
                      : "border-foreground/24 bg-background",
                    tintTransition
                  )}
                  onClick={() => onToggleTask(task.id)}
                  type="button"
                >
                  <AnimatePresence initial={false}>
                    {task.done && (
                      <motion.span
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                        exit={{ opacity: 0, scale: 0.6 }}
                        initial={{ opacity: 0, scale: 0.6 }}
                        transition={{
                          type: "spring",
                          stiffness: 600,
                          damping: 30,
                        }}
                      >
                        <CheckIcon className="size-[0.8em]" strokeWidth={3.2} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[0.92em] transition-colors duration-200",
                    task.done &&
                      "text-muted-foreground line-through decoration-foreground/24"
                  )}
                >
                  {task.title}
                </span>
                <span
                  className={cn(
                    "hidden shrink-0 rounded-[calc(var(--radius)*0.4)] px-[0.45em] py-[0.1em] text-[0.75em] @md/app:inline",
                    task.dueToday
                      ? cn(
                          "bg-[color-mix(in_srgb,var(--tint)_14%,transparent)] font-medium text-(--tint-ink)",
                          tintTransition
                        )
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {task.due}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "flex size-[1.55em] shrink-0 items-center justify-center rounded-full",
                    ownerHues[owners.indexOf(task.owner) % ownerHues.length]
                  )}
                >
                  <span className="font-semibold text-[0.6em] leading-none">
                    {initialsOf(task.owner)}
                  </span>
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemePreview({
  resolved,
  prefs,
  tasks,
  onToggleTask,
  workspace,
  calm,
}: {
  resolved: "light" | "dark";
  prefs: ThemePrefs;
  tasks: PreviewTask[];
  onToggleTask: (id: string) => void;
  workspace: string;
  calm: boolean;
}) {
  const [layers, setLayers] = useState<
    { key: number; theme: "light" | "dark"; animate: boolean }[]
  >([{ key: 0, theme: resolved, animate: false }]);
  const settled = useRef(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      settled.current = true;
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    setLayers((current) => {
      const top = current[current.length - 1];
      if (!top || top.theme === resolved) return current;
      if (!settled.current)
        return [{ key: top.key + 1, theme: resolved, animate: false }];
      return [
        ...current.slice(-1),
        { key: top.key + 1, theme: resolved, animate: true },
      ];
    });
  }, [resolved]);

  const origin = "calc(100% - 1.4em) 1.25em";

  return (
    <div
      className="relative size-full overflow-hidden rounded-lg border shadow-xs/5"
      style={{ fontSize: `${prefs.textSize * 0.86}px` }}
    >
      {layers.map((layer, i) => {
        const top = i === layers.length - 1;
        return (
          <motion.div
            animate={
              calm ? { opacity: 1 } : { clipPath: `circle(150% at ${origin})` }
            }
            className="absolute inset-0"
            initial={
              layer.animate
                ? calm
                  ? { opacity: 0 }
                  : { clipPath: `circle(0% at ${origin})` }
                : false
            }
            key={layer.key}
            onAnimationComplete={() => {
              if (top)
                setLayers((current) =>
                  current.length > 1 ? current.slice(-1) : current
                );
            }}
            transition={
              calm
                ? { duration: 0.2, ease: "linear" }
                : { duration: 0.55, ease: easeOut }
            }
          >
            <MiniApp
              onToggleTask={onToggleTask}
              prefs={prefs}
              tasks={tasks}
              theme={layer.theme}
              workspace={workspace}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

function ThemeThumb({
  variant,
  accent,
}: {
  variant: "light" | "dark";
  accent: AccentName;
}) {
  return (
    <span
      className={cn(
        "flex size-full bg-background",
        variant === "dark" && "dark"
      )}
      style={tintStyle(variant, accent)}
    >
      <span className="flex w-[26%] flex-col gap-[6%] border-e bg-muted px-[5%] pt-[9%]">
        <span
          className={cn(
            "size-2.5 rounded-[calc(var(--radius)*0.3)] bg-(--tint)",
            tintTransition
          )}
        />
        <span className="h-1 w-4/5 rounded-full bg-foreground/20" />
        <span className="h-1 w-3/5 rounded-full bg-foreground/12" />
        <span className="h-1 w-4/5 rounded-full bg-foreground/12" />
      </span>
      <span className="flex flex-1 flex-col gap-[7%] px-[8%] pt-[9%]">
        <span className="flex items-center justify-between">
          <span className="h-1.5 w-2/5 rounded-full bg-foreground/56" />
          <span
            className={cn(
              "h-2.5 w-1/4 rounded-[calc(var(--radius)*0.3)] bg-(--tint)",
              tintTransition
            )}
          />
        </span>
        {[0, 1, 2, 3].map((row) => (
          <span
            className="flex items-center gap-[6%] border-b pb-[5%] last:border-b-0"
            key={row}
          >
            <span className="size-1.5 shrink-0 rounded-[calc(var(--radius)*0.2)] border border-foreground/24" />
            <span
              className={cn(
                "h-1 rounded-full bg-foreground/16",
                row % 2 ? "w-1/2" : "w-3/4"
              )}
            />
          </span>
        ))}
      </span>
    </span>
  );
}

function ThemeCard({
  value,
  label,
  accent,
}: {
  value: ThemeChoice;
  label: string;
  accent: AccentName;
}) {
  return (
    <RadioPrimitive.Root
      className="group flex min-w-0 cursor-pointer flex-col items-center gap-2 outline-none"
      value={value}
    >
      <span
        className={cn(
          "relative block aspect-16/11 w-full overflow-hidden rounded-lg border ring-offset-2 ring-offset-background transition-[box-shadow,scale] duration-150 ease-out group-active:scale-[0.98] group-focus-visible:ring-2 group-focus-visible:ring-ring",
          "group-data-checked:ring-2 group-data-checked:ring-foreground [@media(hover:hover)]:group-hover:not-group-data-checked:border-foreground/24"
        )}
      >
        {value === "system" ? (
          <>
            <span className="absolute inset-0">
              <ThemeThumb accent={accent} variant="light" />
            </span>
            <span className="absolute inset-0 [clip-path:inset(0_0_0_50%)]">
              <ThemeThumb accent={accent} variant="dark" />
            </span>
          </>
        ) : (
          <ThemeThumb accent={accent} variant={value} />
        )}
        <RadioPrimitive.Indicator
          className="absolute top-1.5 inset-e-1.5 flex size-4.5 items-center justify-center rounded-full bg-foreground text-background shadow-xs/5 transition-[opacity,scale] duration-150 ease-out data-starting-style:scale-75 data-starting-style:opacity-0"
          keepMounted={false}
        >
          <CheckIcon className="size-3" strokeWidth={3} />
        </RadioPrimitive.Indicator>
      </span>
      <span className="text-muted-foreground text-sm transition-colors group-data-checked:font-medium group-data-checked:text-foreground">
        {label}
      </span>
    </RadioPrimitive.Root>
  );
}

function Section({
  title,
  description,
  aside,
  children,
}: {
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-medium text-sm">{title}</h2>
          {description && (
            <p className="text-pretty text-muted-foreground text-sm">
              {description}
            </p>
          )}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function RowText({ label, help }: { label: string; help: string }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="font-medium text-sm">{label}</span>
      <span className="text-pretty text-muted-foreground text-xs">{help}</span>
    </span>
  );
}

function ThemeSettingsScreen({
  prefs: saved,
  status = "ready",
  error,
  onRetry,
  onSave,
  defaults,
  workspace,
  previewTasks,
  className,
}: ThemeSettingsProps) {
  const t = useMessages("themeSettings", THEME_SETTINGS_MESSAGES);
  const id = useId();
  const osReduce = useReducedMotionSafe();
  const [prefs, setPrefs] = useState(saved);
  useEffect(() => setPrefs(saved), [saved]);
  const [system, setSystem] = useState<"light" | "dark">("light");
  const [tasks, setTasks] = useState(previewTasks);
  useEffect(() => setTasks(previewTasks), [previewTasks]);
  const [justSaved, setSaved] = useState(false);
  const save = useAction(onSave ?? (async () => {}), {
    optimistic: (next) => {
      const before = prefs;
      setPrefs(next);
      setSaved(false);
      return () => setPrefs(before);
    },
    onSuccess: () => setSaved(true),
  });

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setSystem(query.matches ? "dark" : "light");
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const readOnly = !onSave;
  const update = (patch: Partial<ThemePrefs>) => {
    if (!prefs || readOnly) return;
    const next = { ...prefs, ...patch };
    if (!samePrefs(next, prefs)) void save.run(next);
  };
  const toggleTask = (taskId: string) =>
    setTasks((all) =>
      all.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task
      )
    );

  if (status === "error") {
    return (
      <div
        className={cn(
          "mx-auto w-full max-w-2xl px-6 py-10 md:px-10",
          className
        )}
      >
        <div className="rounded-xl border border-border/60 p-10 text-center">
          <p className="font-medium">{t.errorTitle}</p>
          {error ? (
            <p className="mt-1 text-muted-foreground text-sm">{error}</p>
          ) : null}
          {onRetry ? (
            <Button
              className="mt-4"
              onClick={onRetry}
              size="sm"
              variant="outline"
            >
              {t.retry}
            </Button>
          ) : null}
        </div>
      </div>
    );
  }
  if (!prefs || status === "loading") {
    return (
      <div
        aria-busy="true"
        className={cn(
          "flex flex-col gap-6",
          "mx-auto w-full max-w-2xl px-6 py-10 md:px-10",
          className
        )}
      >
        <Skeleton className="h-8 w-48 motion-reduce:animate-none" />
        <Skeleton className="h-72 w-full motion-reduce:animate-none" />
      </div>
    );
  }

  const resolved = prefs.theme === "system" ? system : prefs.theme;
  const calm = osReduce || prefs.reduceMotion;
  const sizeIndex = Math.max(0, textSizes.indexOf(prefs.textSize));
  const saveState = save.isPending() ? "saving" : justSaved ? "saved" : "idle";

  return (
    <MotionConfig reducedMotion={prefs.reduceMotion ? "always" : "user"}>
      <div
        className={cn(
          "mx-auto w-full max-w-2xl px-6 py-10 md:px-10 text-foreground",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-semibold text-2xl tracking-tight">{t.title}</h1>
            <p className="mt-1 text-pretty text-muted-foreground text-sm">
              {interpolate(t.subtitle, { workspace })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 pt-1">
            <span
              aria-live="polite"
              className="hidden h-7 items-center px-1 text-muted-foreground text-xs sm:flex"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {saveState !== "idle" && (
                  <motion.span
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5"
                    exit={{ opacity: 0, y: -4 }}
                    initial={{ opacity: 0, y: 4 }}
                    key={saveState}
                    transition={{ duration: 0.16, ease: easeOut }}
                  >
                    {saveState === "saving" ? (
                      <span
                        aria-hidden
                        className="size-1.5 animate-pulse rounded-full bg-muted-foreground motion-reduce:animate-none"
                      />
                    ) : (
                      <CheckIcon
                        aria-hidden
                        className="size-3.5 text-success-foreground"
                      />
                    )}
                    {saveState === "saving" ? t.saving : t.saved}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            {defaults && !readOnly ? (
              <Button
                className={press}
                disabled={samePrefs(prefs, defaults) || save.isPending()}
                onClick={() => update(defaults)}
                size="sm"
                variant="ghost"
              >
                {t.reset}
              </Button>
            ) : null}
          </div>
        </div>
        {save.error ? (
          <p className="mt-3 text-destructive-foreground text-sm" role="alert">
            {save.error}
          </p>
        ) : null}

        <Section
          description={
            prefs.theme === "system"
              ? system === "dark"
                ? t.themeSystemDark
                : t.themeSystemLight
              : t.themeHint
          }
          title={t.theme}
        >
          <RadioGroupPrimitive
            aria-label={t.theme}
            className="mt-4 grid grid-cols-3 gap-3 sm:gap-4"
            disabled={readOnly}
            onValueChange={(value) => update({ theme: value as ThemeChoice })}
            value={prefs.theme}
          >
            {THEME_ORDER.map((value) => (
              <ThemeCard
                accent={prefs.accent}
                key={value}
                label={t[value]}
                value={value}
              />
            ))}
          </RadioGroupPrimitive>

          <div className="mt-6 rounded-xl border bg-muted/40 p-2">
            <div className="h-56 sm:h-64">
              <ThemePreview
                calm={calm}
                onToggleTask={toggleTask}
                prefs={prefs}
                resolved={resolved}
                tasks={tasks}
                workspace={workspace}
              />
            </div>
            <div className="flex items-center justify-between gap-3 px-1.5 pt-2 pb-0.5 text-muted-foreground text-xs">
              <span className="truncate">{t.previewCaption}</span>
              <span className="flex shrink-0 items-center gap-1.5 tabular-nums">
                {resolved === "dark" ? (
                  <MoonIcon aria-hidden className="size-3.5" />
                ) : (
                  <SunIcon aria-hidden className="size-3.5" />
                )}
                {interpolate(t.previewMeta, {
                  scheme: t[resolved],
                  size: prefs.textSize,
                })}
              </span>
            </div>
          </div>
        </Section>

        <Section
          aside={
            <span className="text-muted-foreground text-sm">
              {t[prefs.accent]}
            </span>
          }
          description={t.accentHint}
          title={t.accent}
        >
          <RadioGroupPrimitive
            aria-label={t.accent}
            className="mt-3 flex flex-wrap gap-1.5"
            disabled={readOnly}
            onValueChange={(value) => update({ accent: value as AccentName })}
            value={prefs.accent}
          >
            {ACCENT_ORDER.map((name) => (
              <RadioPrimitive.Root
                aria-label={t[name]}
                className="group relative flex size-9 cursor-pointer items-center justify-center rounded-full outline-none data-disabled:cursor-default"
                key={name}
                value={name}
              >
                <span className="absolute inset-0 rounded-full border-2 border-transparent transition-[border-color,scale] duration-200 ease-out group-focus-visible:border-ring group-data-checked:border-foreground/80" />
                <span
                  className={cn(
                    "flex size-6.5 items-center justify-center rounded-full text-white shadow-xs/5 transition-transform duration-150 ease-out group-active:scale-90",
                    accents[name].swatch
                  )}
                >
                  <RadioPrimitive.Indicator
                    className="transition-[opacity,scale] duration-150 ease-out data-starting-style:scale-50 data-starting-style:opacity-0"
                    keepMounted={false}
                  >
                    <CheckIcon className="size-3.5" strokeWidth={3} />
                  </RadioPrimitive.Indicator>
                </span>
              </RadioPrimitive.Root>
            ))}
          </RadioGroupPrimitive>
        </Section>

        <Section description={t.layoutHint} title={t.layout}>
          <div className="mt-3 divide-y rounded-xl border bg-card">
            <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-medium text-sm" id={`${id}-density`}>
                  {t.density}
                </span>
                <span className="text-pretty text-muted-foreground text-xs">
                  {t.densityHint}
                </span>
              </span>
              <RadioGroupPrimitive
                aria-labelledby={`${id}-density`}
                className="flex w-full rounded-lg bg-muted p-0.5 sm:w-auto"
                disabled={readOnly}
                onValueChange={(value) => update({ density: value as Density })}
                value={prefs.density}
              >
                {DENSITY_ORDER.map((d) => (
                  <RadioPrimitive.Root
                    className="h-7 flex-1 cursor-pointer rounded-md px-3 text-muted-foreground text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-background data-checked:font-medium data-checked:text-foreground data-checked:shadow-xs/5 data-disabled:cursor-default sm:flex-none dark:data-checked:bg-accent"
                    key={d}
                    value={d}
                  >
                    {t[d]}
                  </RadioPrimitive.Root>
                ))}
              </RadioGroupPrimitive>
            </div>
            <div className="flex flex-col gap-3 px-4 py-3.5">
              <div className="flex items-center gap-4">
                <RowText help={t.fontSizeHint} label={t.fontSize} />
                <span className="font-mono text-muted-foreground text-xs tabular-nums">
                  {interpolate(t.fontSizeValue, { size: prefs.textSize })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="w-3 text-center text-muted-foreground text-xs"
                >
                  A
                </span>
                <span className="sr-only" id={`${id}-font-size`}>
                  {t.fontSize}
                </span>
                <Slider
                  aria-labelledby={`${id}-font-size`}
                  disabled={readOnly}
                  max={textSizes.length - 1}
                  min={0}
                  onValueChange={(v) => {
                    const i = Array.isArray(v) ? v[0] : v;
                    update({ textSize: textSizes[i ?? 0] ?? 14 });
                  }}
                  step={1}
                  value={sizeIndex}
                />
                <span
                  aria-hidden
                  className="w-3 text-center text-base text-muted-foreground"
                >
                  A
                </span>
              </div>
              <p
                className="truncate rounded-lg bg-muted/60 px-3 py-2 text-foreground/90"
                style={{ fontSize: `${prefs.textSize}px` }}
              >
                {t.sampleText}
              </p>
            </div>
          </div>
        </Section>

        <Section description={t.accessibilityHint} title={t.accessibility}>
          <div className="mt-3 divide-y rounded-xl border bg-card">
            <div className="flex items-center gap-4 px-4 py-3.5">
              <label
                className="min-w-0 flex-1 cursor-pointer"
                htmlFor={`${id}-motion`}
              >
                <RowText
                  help={osReduce ? t.reduceMotionOs : t.reduceMotionHint}
                  label={t.reduceMotion}
                />
              </label>
              <Switch
                checked={prefs.reduceMotion || osReduce}
                disabled={osReduce || readOnly}
                id={`${id}-motion`}
                onCheckedChange={(checked) => update({ reduceMotion: checked })}
              />
            </div>
            <div className="flex items-center gap-4 px-4 py-3.5">
              <label
                className="min-w-0 flex-1 cursor-pointer"
                htmlFor={`${id}-icons`}
              >
                <RowText help={t.sidebarIconsHint} label={t.sidebarIcons} />
              </label>
              <Switch
                checked={prefs.sidebarIcons}
                disabled={readOnly}
                id={`${id}-icons`}
                onCheckedChange={(checked) => update({ sidebarIcons: checked })}
              />
            </div>
          </div>
        </Section>
      </div>
    </MotionConfig>
  );
}

export function ThemeSettings(props: ThemeSettingsProps) {
  return (
    <ScreenBoundary name="ThemeSettings">
      <ThemeSettingsScreen {...props} />
    </ScreenBoundary>
  );
}
