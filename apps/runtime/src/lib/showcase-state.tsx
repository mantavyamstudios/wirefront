// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ScreenState } from "@wirefront/bridge";
import { createContext, useContext } from "react";

/**
 * The states a ready-to-wire screen renders (SCREEN-CONTRACT.md, rule 3).
 * A design lists the ones it supports in designs.ts (`states`); the
 * site switches between them through the `?state=` search
 * param, and the screen's showcase companion reads the current one with
 * useShowcaseState() and passes the matching props (a loading status, empty
 * data, an error…). Showcase-only: never shipped by the registry.
 */
export { SCREEN_STATES, type ScreenState } from "@wirefront/bridge";

const StateContext = createContext<ScreenState>("ready");

export const ShowcaseStateProvider = StateContext.Provider;

/** The state the showcase is currently previewing ("ready" unless switched). */
export function useShowcaseState(): ScreenState {
  return useContext(StateContext);
}

/** A ?state= value, kept to the states the design supports; anything else is "ready". */
export function parseScreenState(
  value: unknown,
  supported: readonly ScreenState[] = []
): ScreenState {
  return typeof value === "string" &&
    (supported as readonly string[]).includes(value)
    ? (value as ScreenState)
    : "ready";
}

/** The next state when cycling with the S key. */
export function nextScreenState(
  current: ScreenState,
  supported: readonly ScreenState[]
): ScreenState {
  if (supported.length === 0) return "ready";
  const i = supported.indexOf(current);
  return supported[(i + 1) % supported.length] ?? "ready";
}
