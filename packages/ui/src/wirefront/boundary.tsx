// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

/**
 * Every ready-to-wire screen renders inside a ScreenBoundary (SCREEN-CONTRACT.md):
 * if the screen throws while rendering, it shows a small fallback with a retry
 * instead of unmounting the builder's page, and reports the error through
 * WirefrontProvider `onError`. React still logs the error to the console.
 *
 *   export function MembersTable(props: MembersTableProps) {
 *     return (
 *       <ScreenBoundary name="MembersTable">
 *         <MembersTableScreen {...props} />
 *       </ScreenBoundary>
 *     );
 *   }
 */
import { Component, type ErrorInfo, type ReactNode } from "react";

import { useMessages, useWirefront } from "./provider";

export const SCREEN_BOUNDARY_MESSAGES = {
  title: "This section couldn’t load",
  description: "Something went wrong while showing it. Try again, or reload the page if it keeps happening.",
  retry: "Try again",
};

interface Props {
  /** The screen's component name, passed to `onError`. */
  name: string;
  children: ReactNode;
  /** Replace the default fallback. Call `retry` to render the screen again. */
  fallback?: (retry: () => void, error: Error) => ReactNode;
}

type Report = (error: Error, info: { screen: string; componentStack?: string }) => void;

class Boundary extends Component<Props & { report?: Report }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.report?.(error, { screen: this.props.name, componentStack: info.componentStack ?? undefined });
  }

  retry = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return this.props.fallback ? this.props.fallback(this.retry, error) : <Fallback onRetry={this.retry} />;
  }
}

function Fallback({ onRetry }: { onRetry: () => void }) {
  const t = useMessages("screenBoundary", SCREEN_BOUNDARY_MESSAGES);
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center text-sm" role="alert">
      <p className="font-medium">{t.title}</p>
      <p className="max-w-sm text-pretty text-muted-foreground">{t.description}</p>
      <button
        className="mt-2 inline-flex h-8 items-center rounded-md border bg-background px-3 font-medium outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onRetry}
        type="button"
      >
        {t.retry}
      </button>
    </div>
  );
}

/** Contain a screen's render errors: fallback with retry, reported through the provider's `onError`. */
export function ScreenBoundary(props: Props) {
  const { onError } = useWirefront();
  return <Boundary {...props} report={onError} />;
}
