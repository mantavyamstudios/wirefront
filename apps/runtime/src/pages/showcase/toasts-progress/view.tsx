// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
} from "@wirefront/ui/wirefront/provider";
import {
  CheckIcon,
  ChevronDownIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  XIcon,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import type { Upload } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("uploadDock.<key>"). */
export const UPLOAD_DOCK_MESSAGES = {
  region: "Uploads",
  complete: "Uploads complete",
  uploading: "Uploading {done} of {total}",
  expand: "Expand uploads",
  collapse: "Collapse uploads",
  close: "Close uploads",
  uploadingFile: "Uploading {name}",
  cancel: "Cancel",
  cancelFile: "Cancel {name}",
  done: "Done",
};

export interface UploadDockProps {
  /** The uploads and their progress; update them as they go. Nothing renders while empty. */
  uploads: Upload[];
  /** Stop an upload. Hidden without it. */
  onCancel?: (id: string) => void;
  /** Close the dock. Hidden without it. */
  onClose?: () => void;
  className?: string;
}

const KIND_ICON: Record<Upload["kind"], ReactNode> = {
  image: <ImageIcon className="size-3.5 opacity-70" />,
  doc: <FileTextIcon className="size-3.5 opacity-70" />,
  other: <FileIcon className="size-3.5 opacity-70" />,
};

// A persistent upload dock rather than a transient toast: it lives until the uploads finish
// or the user closes it. Phones: full-width above the home indicator. sm+: a 24rem panel
// bottom-right. Collapsible on both.
function UploadDockScreen({
  uploads,
  onCancel,
  onClose,
  className,
}: UploadDockProps) {
  const t = useMessages("uploadDock", UPLOAD_DOCK_MESSAGES);
  const fmt = useFormat();
  const [collapsed, setCollapsed] = useState(false);
  if (!uploads.length) return null;
  const done = uploads.filter((u) => u.progress >= 1).length;
  const finished = done === uploads.length;
  const size = (b: number) =>
    b >= 1_048_576
      ? fmt.number(b / 1_048_576, {
          style: "unit",
          unit: "megabyte",
          maximumFractionDigits: 1,
        })
      : fmt.number(Math.max(1, Math.round(b / 1024)), {
          style: "unit",
          unit: "kilobyte",
        });
  const iconButton =
    "grid size-8 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-10";

  return (
    <section
      aria-label={t.region}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-border/70 border-t bg-background pb-[env(safe-area-inset-bottom)] shadow-lg sm:inset-x-auto sm:inset-e-6 sm:bottom-6 sm:w-96 sm:rounded-xl sm:border sm:pb-0",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-border/60 border-b py-1.5 ps-3.5 pe-1.5">
        <div className="flex min-w-0 items-center gap-2">
          {finished ? (
            <CheckIcon
              aria-hidden
              className="size-4 text-category-2-foreground"
            />
          ) : (
            <span
              aria-hidden
              className="size-2 rounded-full bg-primary motion-safe:animate-pulse"
            />
          )}
          {/* Announced when the count changes, not on every progress tick. */}
          <span aria-live="polite" className="font-medium text-sm">
            {finished
              ? t.complete
              : interpolate(t.uploading, { done, total: uploads.length })}
          </span>
        </div>
        <div className="flex items-center">
          <button
            aria-expanded={!collapsed}
            aria-label={collapsed ? t.expand : t.collapse}
            className={iconButton}
            onClick={() => setCollapsed((c) => !c)}
            type="button"
          >
            <ChevronDownIcon
              aria-hidden
              className={cn(
                "size-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </button>
          {onClose ? (
            <button
              aria-label={t.close}
              className={iconButton}
              onClick={onClose}
              type="button"
            >
              <XIcon aria-hidden className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>
      {!collapsed ? (
        <ul className="max-h-[50svh] divide-y divide-border/40 overflow-y-auto">
          {uploads.map((u) => {
            const pct = Math.round(u.progress * 100);
            return (
              <li className="flex items-center gap-3 px-3.5 py-2.5" key={u.id}>
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground/5"
                >
                  {KIND_ICON[u.kind]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-sm">
                      {u.name}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
                      {fmt.number(u.progress, { style: "percent" })}
                    </span>
                  </div>
                  <div
                    aria-label={interpolate(t.uploadingFile, { name: u.name })}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={pct}
                    className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/6"
                    role="progressbar"
                  >
                    <div
                      className="h-full rounded-full bg-foreground/70 transition-[width] motion-reduce:transition-none"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-muted-foreground text-xs">
                    <span>{size(u.bytes)}</span>
                    {u.progress < 1 ? (
                      onCancel ? (
                        <button
                          className="-me-2 min-h-8 rounded px-2 font-mono text-[11px] uppercase tracking-[0.15em] outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10"
                          onClick={() => onCancel(u.id)}
                          type="button"
                        >
                          <span className="sr-only">
                            {interpolate(t.cancelFile, { name: u.name })}
                          </span>
                          <span aria-hidden>{t.cancel}</span>
                        </button>
                      ) : null
                    ) : (
                      <span className="min-h-8 py-2 font-mono text-[11px] uppercase tracking-[0.15em]">
                        {t.done}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

export function UploadDock(props: UploadDockProps) {
  return (
    <ScreenBoundary name="UploadDock">
      <UploadDockScreen {...props} />
    </ScreenBoundary>
  );
}
