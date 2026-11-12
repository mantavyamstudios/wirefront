// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ErrorComponentProps } from "@tanstack/react-router";
import { useEffect } from "react";

/**
 * Shown when a route throws. Marks <html data-design-error> with the message
 * so browser checks (scripts/lib/settle.ts) fail at once with the real error
 * instead of waiting for a layout that will never be ready.
 */
export function DesignError({ error }: ErrorComponentProps) {
  const message = error instanceof Error ? error.message : String(error);
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-design-error", message.slice(0, 500));
    return () => root.removeAttribute("data-design-error");
  }, [message]);
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground" role="alert">
      <div className="max-w-md space-y-2 text-center">
        <p className="font-medium">This screen failed to load.</p>
        <p className="break-words font-mono text-muted-foreground text-xs">{message}</p>
      </div>
    </div>
  );
}
