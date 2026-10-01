import { useState } from "react";
import { TriangleAlertIcon, Trash2Icon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@orbit/ui/alert-dialog";
import { Button } from "@orbit/ui/button";
import { Input } from "@orbit/ui/input";

const PHRASE = "delete acme-prod";

// A real AlertDialog (focus trap, Esc, role="alertdialog", scroll lock). It
// opens by default for the showcase and becomes a bottom sheet on phones.
export function ModalsConfirmDeleteShowcasePage() {
  const [value, setValue] = useState("");
  const matches = value === PHRASE;

  return (
    <div className="relative min-h-svh bg-background">
      {/* Page underneath */}
      <div className="px-4 py-8 sm:px-10 sm:py-10">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          Settings · Workspace
        </div>
        <h1 className="mt-1 font-heading text-2xl">Danger zone</h1>
        <div className="mt-6 flex max-w-xl flex-col gap-3 rounded-xl border border-border/60 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm">Delete workspace</div>
            <div className="mt-1 text-muted-foreground text-xs">
              Permanently remove this workspace and all data. This cannot be
              undone.
            </div>
          </div>
          <AlertDialog defaultOpen onOpenChange={(open) => !open && setValue("")}>
            <AlertDialogTrigger render={<Button variant="destructive" size="sm" className="shrink-0 self-start sm:self-auto" />}>
              <Trash2Icon />
              Delete workspace
            </AlertDialogTrigger>
            <AlertDialogPopup className="sm:max-w-md">
              <AlertDialogHeader className="sm:flex-row sm:items-start sm:gap-3">
                <div className="mx-auto flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive sm:mx-0">
                  <TriangleAlertIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <AlertDialogTitle>Delete acme-prod workspace?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes 12 projects, 84 documents, and
                    revokes access for 28 members. Backups retained for 30 days.
                  </AlertDialogDescription>
                </div>
              </AlertDialogHeader>

              <div className="mx-6 mb-5 rounded-lg border border-border/60 bg-background p-3 text-xs">
                <label htmlFor="confirm-phrase" className="text-muted-foreground">
                  Type{" "}
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
                    {PHRASE}
                  </span>{" "}
                  to confirm.
                </label>
                <Input
                  id="confirm-phrase"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={PHRASE}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="mt-2 font-mono"
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogClose render={<Button variant="ghost" type="button" />}>
                  Cancel
                </AlertDialogClose>
                <Button type="button" variant="destructive" disabled={!matches}>
                  <Trash2Icon />
                  Delete forever
                </Button>
              </AlertDialogFooter>
            </AlertDialogPopup>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
