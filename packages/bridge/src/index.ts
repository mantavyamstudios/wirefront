// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * The messages between the site (apps/www) and the preview runtime
 * (apps/runtime) it embeds in one iframe. The site never reloads the iframe:
 * it switches screens, states, theme and direction with these messages, and
 * the runtime answers `wf:ready` once the requested screen has mounted.
 */

export const SCREEN_STATES = ["ready", "loading", "empty", "error", "forbidden"] as const;
export type ScreenState = (typeof SCREEN_STATES)[number];

export type ThemeMode = "light" | "dark";
export type Direction = "ltr" | "rtl";

/** Site → runtime. */
export type HostMessage =
  | { type: "wf:navigate"; category: string; design: string }
  | { type: "wf:reset" }
  | { type: "wf:theme"; mode: ThemeMode; palette: string }
  | { type: "wf:state"; state: ScreenState }
  | { type: "wf:dir"; dir: Direction };

/** Runtime → site. */
export type RuntimeMessage =
  | { type: "wf:ready"; category: string; design: string }
  | { type: "wf:error"; message: string };

/** The runtime's address for one screen. */
export function previewPath(category: string, design: string): string {
  return `/preview/${category}/${design}`;
}

const HOST_TYPES = new Set(["wf:navigate", "wf:reset", "wf:theme", "wf:state", "wf:dir"]);
const RUNTIME_TYPES = new Set(["wf:ready", "wf:error"]);

function typeOf(data: unknown): string | undefined {
  return typeof data === "object" && data !== null && typeof (data as { type?: unknown }).type === "string"
    ? (data as { type: string }).type
    : undefined;
}

const isString = (v: unknown): v is string => typeof v === "string" && v.length > 0;

/** Narrows an incoming message to a well-formed host message, or null. */
export function parseHostMessage(data: unknown): HostMessage | null {
  const type = typeOf(data);
  if (!type || !HOST_TYPES.has(type)) return null;
  const m = data as Record<string, unknown>;
  switch (type) {
    case "wf:navigate":
      return isString(m.category) && isString(m.design)
        ? { type, category: m.category, design: m.design }
        : null;
    case "wf:reset":
      return { type };
    case "wf:theme":
      return (m.mode === "light" || m.mode === "dark") && isString(m.palette)
        ? { type, mode: m.mode, palette: m.palette }
        : null;
    case "wf:state":
      return (SCREEN_STATES as readonly unknown[]).includes(m.state) ? { type, state: m.state as ScreenState } : null;
    case "wf:dir":
      return m.dir === "ltr" || m.dir === "rtl" ? { type, dir: m.dir } : null;
    default:
      return null;
  }
}

/** Narrows an incoming message to a well-formed runtime message, or null. */
export function parseRuntimeMessage(data: unknown): RuntimeMessage | null {
  const type = typeOf(data);
  if (!type || !RUNTIME_TYPES.has(type)) return null;
  const m = data as Record<string, unknown>;
  if (type === "wf:ready") {
    return isString(m.category) && isString(m.design) ? { type, category: m.category, design: m.design } : null;
  }
  return typeof m.message === "string" ? { type: "wf:error", message: m.message } : null;
}
