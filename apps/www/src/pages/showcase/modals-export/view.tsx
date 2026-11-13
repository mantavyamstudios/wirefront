// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Button } from "@wirefront/ui/button";
import { Checkbox } from "@wirefront/ui/checkbox";
import { CheckboxGroup } from "@wirefront/ui/checkbox-group";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@wirefront/ui/dialog";
import { Label } from "@wirefront/ui/label";
import { cn } from "@wirefront/ui/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@wirefront/ui/select";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { CalendarIcon, DownloadIcon, FileJsonIcon, FileSpreadsheetIcon, FileTextIcon, type LucideIcon } from "lucide-react";
import { useId, useState } from "react";

import { type ExportFormat, ExportInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("exportDialog.<key>"). */
export const EXPORT_DIALOG_MESSAGES = {
  pageTitle: "Analytics",
  trigger: "Export",
  title: "Export data",
  description: "We’ll email you the download link.",
  format: "Format",
  csv: "CSV",
  csvHint: "Spreadsheet",
  json: "JSON",
  jsonHint: "Raw, with metadata",
  pdf: "PDF",
  pdfHint: "Print-ready report",
  range: "Date range",
  lastDays: "Last {count} days",
  rangeDates: "{from} – {to}",
  include: "Include",
  estimate: "Estimated size · {size}",
  cancel: "Cancel",
  export: "Export",
};

export interface ExportSection {
  id: string;
  label: string;
  /** Ticked when the dialog opens. */
  defaultIncluded?: boolean;
}

export interface ExportDialogProps {
  /** What can go in the export. */
  sections: ExportSection[];
  /** Start the export (requestExport). Resolve to close the dialog. */
  onExport: Action<ExportInput>;
  formats?: ExportFormat[];
  /** Range choices, in days back from now. */
  rangeOptions?: number[];
  defaultRangeDays?: number;
  /** A size estimate for the current choices, e.g. "~3.4 MB". Hidden without it. */
  estimateSize?: (input: ExportInput) => string | undefined;
  /** Open the dialog on first render. */
  defaultOpen?: boolean;
  className?: string;
}

const ICON: Record<ExportFormat, LucideIcon> = { csv: FileSpreadsheetIcon, json: FileJsonIcon, pdf: FileTextIcon };
const eyebrow = "mb-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]";

function ExportDialogScreen({
  sections,
  onExport,
  formats = ["csv", "json", "pdf"],
  rangeOptions = [7, 30, 90],
  defaultRangeDays = 30,
  estimateSize,
  defaultOpen,
  className,
}: ExportDialogProps) {
  const t = useMessages("exportDialog", EXPORT_DIALOG_MESSAGES);
  const format = useFormat();
  const { now } = useWirefront();
  const id = useId();
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [fileFormat, setFileFormat] = useState<ExportFormat>(formats[0] ?? "csv");
  const [days, setDays] = useState(defaultRangeDays);
  const [include, setInclude] = useState(() => sections.filter((s) => s.defaultIncluded).map((s) => s.id));
  const [invalid, setInvalid] = useState<string>();
  const exporter = useAction(onExport, { onSuccess: () => setOpen(false) });

  const to = now();
  const from = new Date(to.getTime() - days * 86_400_000);
  const input = { format: fileFormat, from: from.toISOString(), to: to.toISOString(), include };
  const estimate = estimateSize?.(input);
  const hint: Record<ExportFormat, string> = { csv: t.csvHint, json: t.jsonHint, pdf: t.pdfHint };
  const ranges = rangeOptions.map((d) => ({ value: String(d), label: interpolate(t.lastDays, { count: d }) }));

  const submit = () => {
    const parsed = ExportInput.safeParse(input);
    if (!parsed.success) {
      setInvalid(parsed.error.issues[0]?.message);
      return;
    }
    setInvalid(undefined);
    void exporter.run(parsed.data);
  };
  const failure = invalid ?? exporter.error;

  return (
    // Real Dialog (focus trap, Esc, scroll lock); bottom sheet on phones.
    <div className={cn("relative min-h-svh bg-background", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-8 sm:px-10 sm:py-10">
        <h1 className="font-heading text-2xl">{t.pageTitle}</h1>
        <Dialog onOpenChange={(next) => !exporter.isPending() && setOpen(next)} open={open}>
          <DialogTrigger render={<Button variant="outline" />}>
            <DownloadIcon />
            {t.trigger}
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">{t.title}</DialogTitle>
              <DialogDescription>{t.description}</DialogDescription>
            </DialogHeader>

            <div className="-mx-4 min-h-0 min-w-0 space-y-5 overflow-y-auto px-4">
              <div>
                <div className={eyebrow} id={`${id}-format`}>
                  {t.format}
                </div>
                <RadioGroup aria-labelledby={`${id}-format`} className="flex flex-col gap-2" onValueChange={(v) => setFileFormat(v as ExportFormat)} value={fileFormat}>
                  {formats.map((f) => {
                    const Icon = ICON[f];
                    return (
                      <Radio.Root
                        className="group flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5 text-start outline-none transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring data-checked:border-foreground/60 data-checked:bg-foreground/[0.04]"
                        key={f}
                        value={f}
                      >
                        <span
                          aria-hidden
                          className="size-3.5 rounded-full border border-border group-data-checked:border-foreground group-data-checked:bg-foreground group-data-checked:ring-2 group-data-checked:ring-foreground/20 group-data-checked:ring-offset-2 group-data-checked:ring-offset-background"
                        />
                        <Icon aria-hidden className="size-4 opacity-70" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm">{t[f]}</span>
                          <span className="block text-muted-foreground text-xs">{hint[f]}</span>
                        </span>
                      </Radio.Root>
                    );
                  })}
                </RadioGroup>
              </div>

              <div>
                <div className={eyebrow} id={`${id}-range`}>
                  {t.range}
                </div>
                <Select items={ranges} onValueChange={(v) => v && setDays(Number(v))} value={String(days)}>
                  <SelectTrigger aria-labelledby={`${id}-range`} className="w-full pointer-coarse:min-h-11">
                    <CalendarIcon aria-hidden className="opacity-60" />
                    <span className="flex-1 text-start text-sm">
                      {interpolate(t.rangeDates, { from: format.date(from, { month: "short", day: "numeric" }), to: format.date(to, { dateStyle: "medium" }) })}
                    </span>
                    <span className="sr-only">
                      <SelectValue />
                    </span>
                  </SelectTrigger>
                  <SelectContent align="start">
                    {ranges.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className={eyebrow} id={`${id}-include`}>
                  {t.include}
                </div>
                <CheckboxGroup aria-labelledby={`${id}-include`} className="flex flex-col gap-1.5" onValueChange={setInclude} value={include}>
                  {sections.map((s) => (
                    <Label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 font-normal text-sm hover:bg-foreground/[0.03] pointer-coarse:min-h-11" key={s.id}>
                      <Checkbox value={s.id} />
                      {s.label}
                    </Label>
                  ))}
                </CheckboxGroup>
              </div>

              {failure ? (
                <p className="text-destructive-foreground text-sm" role="alert">
                  {failure}
                </p>
              ) : null}
            </div>

            <DialogFooter className="sm:items-center">
              {estimate ? <span className="text-center text-muted-foreground text-xs sm:me-auto sm:text-start">{interpolate(t.estimate, { size: estimate })}</span> : null}
              <DialogClose disabled={exporter.isPending()} render={<Button type="button" variant="ghost" />}>
                {t.cancel}
              </DialogClose>
              <Button aria-busy={exporter.isPending()} disabled={exporter.isPending()} onClick={submit} type="button">
                {exporter.isPending() ? <Spinner data-icon="inline-start" /> : <DownloadIcon />}
                {t.export}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export function ExportDialog(props: ExportDialogProps) {
  return (
    <ScreenBoundary name="ExportDialog">
      <ExportDialogScreen {...props} />
    </ScreenBoundary>
  );
}
