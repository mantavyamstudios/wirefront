// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { buttonVariants } from "@wirefront/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@wirefront/ui/empty";
import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import { Trash2Icon } from "lucide-react";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("emptyTrash.<key>"). */
export const EMPTY_TRASH_MESSAGES = {
  heading: "Trash",
  retention: "Items here are permanently removed after {days} days.",
  title: "Trash is empty.",
  description: "Nothing’s been deleted recently. When you remove a project or file, it’ll show up here for {days} days before disappearing for good.",
  back: "Back to projects",
};

export interface EmptyTrashProps {
  /** How long deleted items stay in the trash. */
  retentionDays: number;
  /** Where "Back to projects" goes. Hidden when not given. */
  backHref?: string;
  className?: string;
}

function EmptyTrashScreen({ retentionDays, backHref, className }: EmptyTrashProps) {
  const t = useMessages("emptyTrash", EMPTY_TRASH_MESSAGES);
  return (
    <section aria-labelledby="empty-trash-heading" className={cn("rounded-2xl border border-border/70 bg-background", className)}>
      <div className="border-border/60 border-b px-4 py-3 sm:px-5">
        <h1 className="font-heading text-base" id="empty-trash-heading">
          {t.heading}
        </h1>
        <p className="text-muted-foreground text-xs">{interpolate(t.retention, { days: retentionDays })}</p>
      </div>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Trash2Icon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>{t.title}</EmptyTitle>
          <EmptyDescription>{interpolate(t.description, { days: retentionDays })}</EmptyDescription>
        </EmptyHeader>
        {backHref ? (
          <EmptyContent>
            <WirefrontLink className={buttonVariants({ size: "sm", variant: "outline" })} href={backHref}>
              {t.back}
            </WirefrontLink>
          </EmptyContent>
        ) : null}
      </Empty>
    </section>
  );
}

export function EmptyTrash(props: EmptyTrashProps) {
  return (
    <ScreenBoundary name="EmptyTrash">
      <EmptyTrashScreen {...props} />
    </ScreenBoundary>
  );
}
