// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: a placeholder app behind the toast demos, with one trigger button.
// Not shipped by the registry.
import { Button } from "@wirefront/ui/button";

export function ToastBackdrop({
  action,
  onAction,
  topPadding = "pt-24",
}: {
  action: string;
  onAction: () => void;
  topPadding?: string;
}) {
  return (
    <div className="grid min-h-svh grid-cols-1 md:grid-cols-[200px_1fr]">
      <div
        aria-hidden
        className="space-y-2 border-border/40 border-e bg-foreground/2 p-4 opacity-50 max-md:hidden"
      >
        <div className="h-3 w-24 rounded bg-foreground/10" />
        <div className="h-2 w-32 rounded bg-foreground/10" />
        <div className="h-2 w-28 rounded bg-foreground/10" />
        <div className="h-2 w-24 rounded bg-foreground/10" />
      </div>
      <div className={`space-y-3 p-4 sm:p-10 ${topPadding}`}>
        <div aria-hidden className="space-y-3 opacity-50">
          <div className="h-4 w-48 max-w-full rounded bg-foreground/15" />
          <div className="h-2 w-72 max-w-full rounded bg-foreground/10" />
          <div className="h-32 rounded-xl border border-border/40 bg-foreground/2" />
        </div>
        <Button onClick={onAction} type="button">
          {action}
        </Button>
      </div>
    </div>
  );
}
