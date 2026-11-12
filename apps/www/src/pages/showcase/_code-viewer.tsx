// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { useEffect, useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { CheckIcon, ChevronDownIcon, CopyIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { useTheme } from "@wirefront/ui/theme-provider";
import type { CategorySlug } from "@/lib/designs";
import { getSourceFile } from "./source-files";

const RAW_SOURCES = import.meta.glob("./*.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function getSource(category: CategorySlug, design: string): { filename: string; code: string } | null {
  const filename = getSourceFile(category, design);
  if (!filename) return null;
  const code = RAW_SOURCES[`./${filename}.tsx`];
  if (!code) return null;
  return { filename, code };
}

interface CodeStageProps {
  category: CategorySlug;
  design: string;
  title: string;
}

const SETUP_COMMANDS: { label: string; value: string }[] = [
  { label: "Init shadcn", value: "npx shadcn@latest init" },
];

const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * Inline code view, devl.dev style: it takes the design's place (no dialog or
 * backdrop) while the interaction panel collapses to Preview | Code.
 */
export function CodeStage({ category, design, title }: CodeStageProps) {
  const source = getSource(category, design);
  const { resolved } = useTheme();
  const reduce = useReducedMotion();
  const [setupOpen, setSetupOpen] = useState(false);
  const registryUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/r/${category}-${design}.json`
      : `/r/${category}-${design}.json`;
  const installCommand = `npx shadcn@latest add ${registryUrl}`;
  const transition = reduce ? { duration: 0 } : { duration: 0.35, ease: EASE };

  return (
    <motion.section
      animate={{ opacity: 1 }}
      aria-label={`${title} source`}
      className="fixed inset-0 z-[45] flex flex-col overflow-hidden bg-background bg-linear-to-b from-muted to-muted px-3 pt-3 pb-20 font-sans sm:px-6 sm:pt-6"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      transition={transition}
    >
      <motion.div
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden rounded-3xl border bg-card shadow-sm/5"
        exit={{ opacity: 0, y: 12, scale: 0.985 }}
        initial={{ opacity: 0, y: 12, scale: 0.985 }}
        transition={transition}
      >
        <div className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b px-4 py-2 sm:px-5">
          <div className="flex min-w-0 flex-col">
            <h2 className="truncate font-heading font-semibold text-[15px] leading-tight">{title}</h2>
            {source ? (
              <span className="truncate font-mono text-[11px] text-muted-foreground">{source.filename}.tsx</span>
            ) : null}
          </div>
          <CopyButton disabled={!source} label="Copy code" value={source?.code ?? ""} />
        </div>

        <div
          aria-label={source ? `${source.filename}.tsx` : "Source"}
          className="min-h-24 flex-1 overflow-auto overscroll-contain bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          role="region"
          tabIndex={0}
        >
          {source ? (
            <CodeBlock code={source.code} dark={resolved === "dark"} />
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-muted-foreground text-sm">
              Source file not found.
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t bg-card px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
              Install with shadcn
            </div>
            <button
              aria-expanded={setupOpen}
              className="flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
              onClick={() => setSetupOpen((v) => !v)}
              type="button"
            >
              First time? Setup
              <ChevronDownIcon className={cn("size-3.5 transition-transform", setupOpen && "rotate-180")} />
            </button>
          </div>

          {setupOpen ? (
            <div className="flex flex-col gap-1.5 rounded-md border bg-background/40 p-2.5">
              <div className="text-[11px] text-muted-foreground">
                Run these once in your project, then any showcase install works:
              </div>
              {SETUP_COMMANDS.map((cmd) => (
                <div className="flex items-center gap-2" key={cmd.value}>
                  <code className="min-w-0 flex-1 truncate rounded-md border bg-background px-2.5 py-1.5 font-mono text-[12px]">
                    {cmd.value}
                  </code>
                  <CopyButton label="Copy" value={cmd.value} />
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-md border bg-background px-2.5 py-1.5 font-mono text-[12px]">
              {installCommand}
            </code>
            <CopyButton label="Copy command" value={installCommand} />
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}

function CodeBlock({ code, dark }: { code: string; dark: boolean }) {
  return (
    <Highlight code={code.trimEnd()} language="tsx" theme={dark ? themes.vsDark : themes.github}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={cn("m-0 px-4 py-4 font-mono text-[12px] leading-[1.55]", className)}
          style={{ ...style, background: "transparent" }}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })} className="table-row">
              <span className="table-cell select-none pr-4 text-right text-muted-foreground/40 tabular-nums">
                {i + 1}
              </span>
              <span className="table-cell whitespace-pre">
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </span>
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}

function CopyButton({ value, label, disabled }: { value: string; label: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(t);
  }, [copied]);

  const onCopy = () => {
    if (disabled || !value) return;
    void navigator.clipboard.writeText(value).then(() => setCopied(true));
  };

  return (
    <Button type="button" size="sm" variant="outline" onClick={onCopy} disabled={disabled} aria-label={label}>
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? "Copied" : label}
    </Button>
  );
}
