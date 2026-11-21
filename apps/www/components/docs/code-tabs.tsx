"use client";

import { cn } from "@workspace/ui/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { CopyButton } from "@/components/docs/copy-button";
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsHighlight,
  TabsHighlightItem,
  TabsList,
  TabsTrigger,
} from "@/registry/primitives/animate/tabs";
import type { TabsProps } from "@/registry/primitives/animate/tabs";

const PACKAGE_MANAGER_STORAGE_KEY = "package-manager";
const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun"] as const;
type PackageManager = (typeof PACKAGE_MANAGERS)[number];

let cachedPackageManager: string | null = null;

const getSavedPackageManager = (): string | null => {
  if (cachedPackageManager) {
    return cachedPackageManager;
  }
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(PACKAGE_MANAGER_STORAGE_KEY);
      if (stored) {
        cachedPackageManager = stored;
        return stored;
      }
    } catch {
      // Ignore localStorage access errors (e.g. private browsing)
    }
  }
  return null;
};

const PACKAGE_MANAGER_CHANGE_EVENT = "package-manager-change";

/** Notified when this or another browser tab picks a package manager. */
const subscribePackageManager = (onChange: () => void) => {
  const handle = (event: Event) => {
    let next: string | null = null;
    if (event instanceof StorageEvent) {
      next = event.key === PACKAGE_MANAGER_STORAGE_KEY ? event.newValue : null;
    } else {
      next = (event as CustomEvent<string>).detail;
    }
    if (next) {
      cachedPackageManager = next;
      onChange();
    }
  };
  window.addEventListener("storage", handle);
  window.addEventListener(PACKAGE_MANAGER_CHANGE_EVENT, handle);
  return () => {
    window.removeEventListener("storage", handle);
    window.removeEventListener(PACKAGE_MANAGER_CHANGE_EVENT, handle);
  };
};

const isPackageManager = (value: string): value is PackageManager =>
  PACKAGE_MANAGERS.includes(value as PackageManager);

const cliHighlightCache = new Map<string, string>();

/** Shiki loads on first use, outside the component so the React Compiler can optimise it. */
const loadShiki = () => import("shiki");

const highlightBashCommandSync = (code: string): string => {
  const escaped = code
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  return `<pre class="font-mono text-[13px] leading-relaxed tracking-tight text-foreground" tabindex="0"><code><span class="line">${escaped}</span></code></pre>`;
};

const buildFallbackHtml = (code: string): string =>
  highlightBashCommandSync(code);

const getInitialHighlightedCodes = (
  codes: Record<string, string>,
  lang: string,
  theme: string
): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const [command, val] of Object.entries(codes)) {
    const key = `${lang}:${theme}:${val}`;
    result[command] = cliHighlightCache.get(key) ?? buildFallbackHtml(val);
  }
  return result;
};

type CodeTabsProps = {
  codes: Record<string, string>;
  lang?: string;
  themes?: { light: string; dark: string };
  copyButton?: boolean;
  onCopiedChange?: (copied: boolean, content?: string) => void;
} & Omit<TabsProps, "children">;

const CODE_TABS_DEFAULT_THEMES = {
  light: "github-light",
  dark: "github-dark",
} as const;

const CodeTabs = ({
  codes,
  lang = "bash",
  themes = CODE_TABS_DEFAULT_THEMES,
  className,
  defaultValue,
  value,
  onValueChange,
  copyButton = true,
  onCopiedChange,
  ...props
}: CodeTabsProps) => {
  const { resolvedTheme } = useTheme();

  const [highlightedCodes, setHighlightedCodes] = useState<
    Record<string, string>
  >(() => getInitialHighlightedCodes(codes, lang, resolvedTheme ?? "dark"));
  // The package manager last picked in any tab, shared across code tabs.
  const savedPackageManager = useSyncExternalStore(
    subscribePackageManager,
    getSavedPackageManager,
    () => null
  );
  // A tab picked here that isn't a package manager (those go to the store).
  const [pickedCode, setPickedCode] = useState<string | null>(null);
  const firstCode = Object.keys(codes)[0] ?? "";
  const savedCode =
    savedPackageManager && savedPackageManager in codes
      ? savedPackageManager
      : undefined;
  const selectedCode =
    value ??
    (pickedCode !== null && pickedCode in codes ? pickedCode : undefined) ??
    savedCode ??
    defaultValue ??
    firstCode;

  // Same commands, same object: a new object with equal entries doesn't re-highlight.
  const codesKey = JSON.stringify(codes);
  const stableCodes = useMemo(
    () => JSON.parse(codesKey) as Record<string, string>,
    [codesKey]
  );

  useEffect(() => {
    let cancelled = false;

    const loadHighlightedCode = async () => {
      const currentTheme = resolvedTheme === "dark" ? "dark" : "light";
      const missing: [string, string][] = [];
      const updated: Record<string, string> = {};

      for (const [command, val] of Object.entries(stableCodes)) {
        const cacheKey = `${lang}:${currentTheme}:${val}`;
        const cached = cliHighlightCache.get(cacheKey);
        if (cached) {
          updated[command] = cached;
        } else {
          missing.push([command, val]);
        }
      }

      if (missing.length === 0) {
        setHighlightedCodes((prev) => {
          const keys = Object.keys(updated);
          if (
            prev &&
            keys.length === Object.keys(prev).length &&
            keys.every((k) => prev[k] === updated[k])
          ) {
            return prev;
          }
          return updated;
        });
        return;
      }

      try {
        const { codeToHtml } = await loadShiki();
        if (cancelled) {
          return;
        }

        await Promise.all(
          missing.map(async ([command, val]) => {
            const cacheKey = `${lang}:${currentTheme}:${val}`;
            const highlighted = await codeToHtml(val, {
              lang,
              themes: {
                light: themes.light,
                dark: themes.dark,
              },
              defaultColor: currentTheme,
            });
            cliHighlightCache.set(cacheKey, highlighted);
            updated[command] = highlighted;
          })
        );

        if (!cancelled) {
          setHighlightedCodes((prev) => {
            const keys = Object.keys(updated);
            if (
              prev &&
              keys.length === Object.keys(prev).length &&
              keys.every((k) => prev[k] === updated[k])
            ) {
              return prev;
            }
            return updated;
          });
        }
      } catch (error) {
        console.error("Error highlighting codes", error);
      }
    };

    loadHighlightedCode();

    return () => {
      cancelled = true;
    };
  }, [resolvedTheme, lang, themes.light, themes.dark, stableCodes]);

  return (
    <Tabs
      className={cn(
        "border-border/60 w-full gap-0 overflow-hidden rounded-xl border",
        className
      )}
      data-slot="install-tabs"
      {...props}
      onValueChange={(val) => {
        setPickedCode(isPackageManager(val) ? null : val);
        if (isPackageManager(val)) {
          cachedPackageManager = val;
          try {
            window.localStorage.setItem(PACKAGE_MANAGER_STORAGE_KEY, val);
            window.dispatchEvent(
              new CustomEvent(PACKAGE_MANAGER_CHANGE_EVENT, {
                detail: val,
              })
            );
          } catch (error) {
            console.error("Error saving package manager preference", error);
          }
        }
        onValueChange?.(val);
      }}
      value={selectedCode}
    >
      <div className="border-border/50 flex h-10 items-center justify-between border-b px-3">
        <TabsList className="flex items-center gap-0.5">
          <TabsHighlight
            className="bg-muted h-full rounded-md"
            containerClassName="flex items-center gap-0.5"
            mode="parent"
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {Object.keys(codes).map((code) => (
              <TabsHighlightItem key={code} value={code}>
                <TabsTrigger
                  className="text-muted-foreground data-[state=active]:text-foreground relative z-10 h-7 rounded-md px-3 text-sm transition-colors"
                  value={code}
                >
                  {code}
                </TabsTrigger>
              </TabsHighlightItem>
            ))}
          </TabsHighlight>
        </TabsList>

        {copyButton && highlightedCodes && (
          <CopyButton
            className="hover:bg-foreground/5 dark:hover:bg-foreground/10 -me-1 bg-transparent"
            content={codes[selectedCode]}
            onCopiedChange={onCopiedChange}
            size="icon-sm"
            variant="ghost"
          />
        )}
      </div>

      <div className="p-1.5">
        <TabsContents
          className="bg-surface rounded-[calc(var(--radius-xl)-7px)]"
          data-slot="install-tabs-contents"
        >
          {Object.entries(codes).map(([code, val]) => (
            <TabsContent
              className="w-full"
              data-slot="install-tabs-content"
              key={code}
              value={code}
            >
              <div className="w-full overflow-x-auto p-4 text-sm">
                <div
                  className="not-fumadocs-codeblock flex w-full items-start [&_.line]:px-0! [&_code]:text-[13px]! [&>pre,&_code]:border-none [&>pre,&_code]:bg-transparent! [&>pre,&_code]:[background:transparent_!important]"
                  // oxlint-disable-next-line react/no-danger -- highlighted code HTML
                  dangerouslySetInnerHTML={{
                    __html: highlightedCodes[code] ?? buildFallbackHtml(val),
                  }}
                />
              </div>
            </TabsContent>
          ))}
        </TabsContents>
      </div>
    </Tabs>
  );
};

export { CodeTabs, type CodeTabsProps };
