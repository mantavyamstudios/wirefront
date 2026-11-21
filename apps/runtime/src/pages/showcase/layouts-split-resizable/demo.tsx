// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: a code editor and live preview in the split. Not shipped by
// the registry; builders pass their own panes.

import { useEffect, useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { Button } from "@wirefront/ui/button";
import { useColorScheme } from "@wirefront/ui/wirefront/provider";
import { SplitPanes } from "./view";
import { ScrollRegion } from "@wirefront/ui/wirefront/scroll-region";

/** VS light with the two token colours that miss 4.5:1 on the editor background darkened. */
const vsLightAA = {
  ...themes.vsLight,
  styles: themes.vsLight.styles.map((rule) =>
    rule.types.includes("attr-name")
      ? { ...rule, style: { ...rule.style, color: "rgb(204, 0, 0)" } }
      : rule.types.includes("class-name")
        ? { ...rule, style: { ...rule.style, color: "rgb(30, 105, 128)" } }
        : rule,
  ),
};

const CODE = `import { useState } from "react";
import { Button } from "@wirefront/ui/button";

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

type Token = { content: string; types: string[] };

/** Each line and token with its character offset in the code, for stable keys. */
function withOffsets(lines: Token[][]) {
  let offset = 0;
  return lines.map((line, i) => {
    const start = offset;
    let at = start;
    // Zero-length tokens render nothing and would share an offset; skip them.
    const parts = line
      .map((token) => {
        const part = { token, at };
        at += token.content.length;
        return part;
      })
      .filter((part) => part.token.content.length > 0);
    offset = at + 1;
    return { line, number: i + 1, offset: start, parts };
  });
}

function EditorPane() {
  // Follows the builder's theme (WirefrontProvider or the `dark` class on <html>).
  const resolved = useColorScheme();
  const theme = resolved === "dark" ? themes.vsDark : vsLightAA;
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
      <ScrollRegion aria-label="playground.tsx" className="min-h-0 flex-1" orientation="both">
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
              {withOffsets(tokens).map(({ line, number, offset, parts }) => (
                // Lines and tokens are keyed by where they start in the code.
                <div key={`line-${offset}`} {...getLineProps({ line })} className="table-row">
                  <span className="table-cell select-none pe-4 text-end font-mono text-muted-foreground text-xs tabular-nums">
                    {number}
                  </span>
                  <span className="table-cell whitespace-pre">
                    {parts.length ? parts.map(({ token, at }) => <span key={`token-${at}`} {...getTokenProps({ token })} />) : " "}
                  </span>
                </div>
              ))}
            </pre>
          )}
        </Highlight>
        )}
      </ScrollRegion>
    </div>
  );
}

function EditorTab({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <span
      className={`rounded-md px-2.5 py-1 font-mono text-[11px] ${
        active ? "bg-foreground/6 text-foreground" : "text-muted-foreground"
      }`}
    >
      {label}
    </span>
  );
}

function PreviewPane({ count }: { count: number }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-1 border-border/60 border-b px-2">
        <EditorTab label="Preview" active />
        <EditorTab label="Console" />
      </div>
      <div
        className="flex flex-1 items-center justify-center overflow-auto p-4 sm:p-8"
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

export function LayoutsSplitResizableShowcasePage() {
  return (
    <SplitPanes
      end={<PreviewPane count={3} />}
      endLabel="Preview"
      start={<EditorPane />}
      startLabel="Code"
      title={
        <span className="min-w-0 truncate font-mono text-muted-foreground text-xs">
          <span className="max-sm:hidden">scratchpad / </span>playground.tsx
        </span>
      }
    />
  );
}
