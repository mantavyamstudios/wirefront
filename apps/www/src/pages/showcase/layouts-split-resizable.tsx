import { type CSSProperties, type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { GripVerticalIcon, PlayIcon, RotateCcwIcon, Share2Icon, WandSparklesIcon } from "lucide-react";
import { Highlight, themes } from "prism-react-renderer";
import { Badge } from "@orbit/ui/badge";
import { Button } from "@orbit/ui/button";
import { Separator } from "@orbit/ui/separator";
import { useTheme } from "@orbit/ui/theme-provider";

const CODE = `import { useState } from "react";
import { Button } from "@orbit/ui/button";

// A tiny counter widget
export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-heading text-xl">
        Live preview
      </h2>
      <p>You clicked {count} times.</p>
      <Button onClick={() => setCount(count + 1)}>
        Increment
      </Button>
    </div>
  );
}
`;

// Each pane keeps at least this much room; percentages alone collapse panes
// to unusable widths on narrow screens.
const MIN_PANE_PX = 280;
const KEY_STEP = 5;

type MobilePane = "code" | "preview";

export function LayoutsSplitResizableShowcasePage() {
  const [leftPct, setLeftPct] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [mobilePane, setMobilePane] = useState<MobilePane>("code");
  const containerRef = useRef<HTMLDivElement>(null);

  const clamp = (pct: number) => {
    const width = containerRef.current?.getBoundingClientRect().width ?? 0;
    const minPct = width > 0 ? Math.max(15, (MIN_PANE_PX / width) * 100) : 15;
    return Math.min(100 - minPct, Math.max(minPct, pct));
  };

  // Pointer Events cover mouse, touch and pen with one code path.
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setLeftPct(clamp(((e.clientX - rect.left) / rect.width) * 100));
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(false);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const next =
      e.key === "ArrowLeft"
        ? leftPct - KEY_STEP
        : e.key === "ArrowRight"
          ? leftPct + KEY_STEP
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? 100
              : e.key === "Enter"
                ? 50
                : null;
    if (next === null) return;
    e.preventDefault();
    setLeftPct(clamp(next));
  };

  const leftLabel = Math.round(leftPct);
  const rightLabel = 100 - leftLabel;

  return (
    <div
      className={`flex h-svh flex-col overflow-hidden bg-background text-foreground ${
        dragging ? "cursor-col-resize select-none" : ""
      }`}
    >
      <header className="flex h-12 shrink-0 items-center gap-2 border-border/60 border-b px-2 sm:gap-3 sm:px-4">
        <span className="min-w-0 truncate font-mono text-muted-foreground text-xs">
          <span className="max-sm:hidden">scratchpad / </span>playground.tsx
        </span>
        <Separator orientation="vertical" className="h-5 max-sm:hidden" />
        <div className="flex shrink-0 items-center gap-1">
          <Button size="xs" variant="ghost" aria-label="Format" className="pointer-coarse:size-10">
            <WandSparklesIcon />
            <span className="max-sm:hidden">Format</span>
          </Button>
          <Button size="xs" variant="ghost" aria-label="Run" className="pointer-coarse:size-10">
            <PlayIcon />
            <span className="max-sm:hidden">Run</span>
          </Button>
          <Button size="xs" variant="ghost" aria-label="Share" className="pointer-coarse:size-10">
            <Share2Icon />
            <span className="max-sm:hidden">Share</span>
          </Button>
        </div>
        {/* Split ratio + reset only matter when the split is visible (md+). */}
        <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex">
          <Badge variant="outline" className="font-mono text-[10px] tracking-wider">
            {leftLabel}% / {rightLabel}%
          </Badge>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setLeftPct(50)}
            disabled={leftLabel === 50}
          >
            <RotateCcwIcon />
            Reset
          </Button>
        </div>
      </header>

      {/* Below md the panes become tabs instead of a split. */}
      <div
        role="tablist"
        aria-label="Panes"
        className="flex shrink-0 gap-1 border-border/60 border-b p-1.5 md:hidden"
      >
        {(["code", "preview"] as const).map((pane) => (
          <button
            key={pane}
            type="button"
            role="tab"
            aria-selected={mobilePane === pane}
            aria-controls={`pane-${pane}`}
            onClick={() => setMobilePane(pane)}
            className={`min-h-10 flex-1 rounded-md font-mono text-xs capitalize transition-colors ${
              mobilePane === pane
                ? "bg-foreground/[0.08] text-foreground"
                : "text-muted-foreground hover:bg-foreground/[0.04]"
            }`}
          >
            {pane}
          </button>
        ))}
      </div>

      <div
        ref={containerRef}
        className="relative flex min-h-0 flex-1 overflow-hidden"
        style={{ "--left": `${leftPct}%` } as CSSProperties}
      >
        <div
          id="pane-code"
          className={`min-w-0 flex-col overflow-hidden bg-foreground/[0.02] md:flex md:w-[var(--left)] md:shrink-0 md:border-border/60 md:border-r ${
            mobilePane === "code" ? "flex w-full" : "hidden"
          }`}
        >
          <EditorPane />
        </div>

        <div
          role="separator"
          tabIndex={0}
          aria-label="Resize panes"
          aria-orientation="vertical"
          aria-controls="pane-code"
          aria-valuenow={leftLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          onDoubleClick={() => setLeftPct(50)}
          className={`group relative z-10 hidden w-3 shrink-0 -mx-1.5 cursor-col-resize touch-none items-center justify-center outline-none md:flex ${
            dragging ? "bg-foreground/10" : "hover:bg-foreground/[0.06] focus-visible:bg-foreground/[0.08]"
          }`}
        >
          <span className="pointer-events-none flex h-10 w-3 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 pointer-coarse:opacity-100">
            <GripVerticalIcon className="size-3 text-muted-foreground" />
          </span>
        </div>

        <div
          id="pane-preview"
          className={`min-w-0 flex-1 flex-col overflow-hidden bg-background md:flex ${
            mobilePane === "preview" ? "flex" : "hidden"
          }`}
        >
          <PreviewPane count={3} dragging={dragging} />
        </div>
      </div>
    </div>
  );
}

function EditorPane() {
  const { resolved } = useTheme();
  const theme = resolved === "dark" ? themes.vsDark : themes.vsLight;
  // The resolved theme is only known on the client; colouring tokens before
  // mount would make the server HTML disagree with hydration.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-1 border-border/60 border-b px-2">
        <EditorTab label="playground.tsx" active />
        <EditorTab label="config.json" />
      </div>
      <div className="flex-1 overflow-auto">
        {!mounted ? (
          <pre className="m-0 whitespace-pre px-3 py-3 font-mono text-[12.5px] leading-[1.65]">
            {CODE.trimEnd()}
          </pre>
        ) : (
        <Highlight code={CODE.trimEnd()} language="tsx" theme={theme}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={`m-0 px-3 py-3 font-mono text-[12.5px] leading-[1.65] ${className}`}
              style={{ ...style, background: "transparent" }}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })} className="table-row">
                  <span className="table-cell select-none pr-4 text-right font-mono text-muted-foreground/40 text-xs tabular-nums">
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
        )}
      </div>
    </div>
  );
}

function EditorTab({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      className={`rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors pointer-coarse:min-h-9 ${
        active
          ? "bg-foreground/[0.06] text-foreground"
          : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function PreviewPane({ count, dragging }: { count: number; dragging: boolean }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-1 border-border/60 border-b px-2">
        <EditorTab label="Preview" active />
        <EditorTab label="Console" />
      </div>
      <div
        className={`flex flex-1 items-center justify-center overflow-auto p-4 sm:p-8 ${
          dragging ? "pointer-events-none" : ""
        }`}
      >
        <div className="flex w-full max-w-sm flex-col gap-3 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-heading font-semibold text-xl">Live preview</h2>
          <p className="text-muted-foreground text-sm">
            You clicked {count} times.
          </p>
          <Button size="sm" className="self-start">
            Increment
          </Button>
        </div>
      </div>
      <div className="flex h-7 shrink-0 items-center justify-between border-border/60 border-t px-3">
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
          Ready · 42ms
        </span>
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
          v1.0.0
        </span>
      </div>
    </div>
  );
}
