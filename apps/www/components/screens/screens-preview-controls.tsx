"use client";

import { Menu } from "@base-ui/react/menu";
import { SCREEN_STATES } from "@wirefront/bridge";
import type { Direction, ScreenState } from "@wirefront/bridge";
import { PALETTES } from "@wirefront/ui/themes";
import type { OrbitThemePalette } from "@wirefront/ui/themes/types";
import { ORBIT_THEME_PALETTES } from "@wirefront/ui/themes/types";
import { Check, Layers } from "lucide-react";
import type { ReactNode } from "react";

const STATE_LABELS: Record<ScreenState, string> = {
  ready: "Ready",
  loading: "Loading",
  empty: "Empty",
  error: "Error",
  forbidden: "Forbidden",
};

const TRIGGER =
  "text-foreground/70 hover:text-foreground data-[popup-open]:bg-background data-[popup-open]:text-foreground dark:data-[popup-open]:bg-foreground/10 flex h-full min-w-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface PreviewMenuProps {
  children: ReactNode;
  label: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string; swatch?: string }[];
  value: string;
}

/** A trigger in the switcher bar that opens a single-choice list. */
function PreviewMenu({ children, label, onValueChange, options, value }: PreviewMenuProps) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger aria-label={label} className={TRIGGER} title={label}>
        {children}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="z-50" side="top" sideOffset={10}>
          <Menu.Popup className="bg-popover text-popover-foreground min-w-40 origin-[var(--transform-origin)] rounded-xl border p-1 shadow-lg transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <Menu.Group>
              <Menu.GroupLabel className="text-muted-foreground px-2 py-1.5 text-xs">{label}</Menu.GroupLabel>
              <Menu.RadioGroup onValueChange={(next: string) => onValueChange(next)} value={value}>
                {options.map((option) => (
                  <Menu.RadioItem
                    className="data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none select-none"
                    closeOnClick
                    key={option.value}
                    value={option.value}
                  >
                    {option.swatch ? (
                      <span aria-hidden className="size-3 shrink-0 rounded-full" style={{ background: option.swatch }} />
                    ) : null}
                    <span className="flex-1">{option.label}</span>
                    <Menu.RadioItemIndicator>
                      <Check className="size-3.5" />
                    </Menu.RadioItemIndicator>
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Group>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

interface ScreensPreviewControlsProps {
  dir: Direction;
  onDirChange: (dir: Direction) => void;
  onPaletteChange: (palette: OrbitThemePalette) => void;
  onStateChange: (state: ScreenState) => void;
  palette: OrbitThemePalette;
  state: ScreenState;
  /** The states the screen declares (designs.ts `states`); none hides the state menu. */
  states: string[];
}

/**
 * The screen's own toolbar beside the device switcher: its declared states,
 * the runtime's accent palettes and the layout direction. Each change goes to
 * the iframe as a bridge message (wf:state, wf:theme, wf:dir).
 */
export function ScreensPreviewControls({
  dir,
  onDirChange,
  onPaletteChange,
  onStateChange,
  palette,
  state,
  states,
}: ScreensPreviewControlsProps) {
  const screenStates = SCREEN_STATES.filter((s) => states.includes(s));
  const isRtl = dir === "rtl";

  return (
    <div className="bg-muted relative flex h-10 shrink-0 items-center gap-0.5 rounded-xl p-1">
      {screenStates.length > 1 ? (
        <PreviewMenu
          label="Screen state"
          onValueChange={(next) => onStateChange(next as ScreenState)}
          options={screenStates.map((s) => ({ value: s, label: STATE_LABELS[s] }))}
          value={state}
        >
          <Layers aria-hidden className="size-4" />
          <span className="max-sm:hidden">{STATE_LABELS[state]}</span>
        </PreviewMenu>
      ) : null}
      <PreviewMenu
        label="Accent palette"
        onValueChange={(next) => onPaletteChange(next as OrbitThemePalette)}
        options={ORBIT_THEME_PALETTES.map((id) => ({
          value: id,
          label: PALETTES[id].name,
          swatch: PALETTES[id].swatch[0],
        }))}
        value={palette}
      >
        <span aria-hidden className="size-3.5 rounded-full" style={{ background: PALETTES[palette].swatch[0] }} />
      </PreviewMenu>
      <button
        aria-label="Right-to-left layout"
        aria-pressed={isRtl}
        className={`${TRIGGER} font-mono ${isRtl ? "bg-background text-foreground dark:bg-foreground/10" : ""}`}
        onClick={() => onDirChange(isRtl ? "ltr" : "rtl")}
        title={isRtl ? "Right to left" : "Left to right"}
        type="button"
      >
        {isRtl ? "RTL" : "LTR"}
      </button>
    </div>
  );
}
