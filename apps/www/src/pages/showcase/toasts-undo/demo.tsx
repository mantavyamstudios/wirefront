// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: archiving a project shows the snackbar; Undo puts it back.
// Not shipped by the registry; builders call notifyUndo after their own reversible change.
import { ArchiveIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@wirefront/ui/button";
import * as fixtures from "./fixtures";
import { createUndoToasts, notifyUndo, UndoToaster } from "./view";

const toasts = createUndoToasts();

export function ToastsUndoShowcasePage() {
  const [archived, setArchived] = useState<string[]>([]);
  const archive = (name: string) => {
    setArchived((a) => [...a, name]);
    notifyUndo(toasts, {
      id: `archived-${name}`,
      title: "Project archived",
      description: `“${name}” moved to archive. Undo within ${fixtures.undoMs / 1000} seconds.`,
      timeout: fixtures.undoMs,
      undo: () => setArchived((a) => a.filter((n) => n !== name)),
    });
  };
  const first = useRef(archive);
  useEffect(() => first.current(fixtures.projects[0] ?? ""), []);
  return (
    <UndoToaster toastManager={toasts}>
      <div className="relative min-h-svh bg-background p-4 pb-32 text-foreground sm:p-10">
        <h1 className="font-heading text-xl">Projects</h1>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fixtures.projects
            .filter((p) => !archived.includes(p))
            .map((p) => (
              <li className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-foreground/[0.02] px-4 py-3" key={p}>
                <span className="min-w-0 truncate text-sm">{p}</span>
                <Button aria-label={`Archive ${p}`} onClick={() => archive(p)} size="sm" type="button" variant="ghost">
                  <ArchiveIcon />
                  <span className="max-sm:sr-only">Archive</span>
                </Button>
              </li>
            ))}
        </ul>
      </div>
    </UndoToaster>
  );
}
