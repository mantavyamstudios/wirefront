// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@wirefront/ui/empty";
import { cn } from "@wirefront/ui/lib/utils";
import { Separator } from "@wirefront/ui/separator";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useMessages } from "@wirefront/ui/wirefront/provider";
import { ArrowRightIcon, FolderPlusIcon, ImportIcon } from "lucide-react";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("firstProject.<key>"). */
export const FIRST_PROJECT_MESSAGES = {
  title: "Start your first project.",
  description:
    "A project is where you’ll keep tasks, docs, and assets. Most teams start with one and split things out later.",
  create: "Create project",
  or: "or",
  import: "Import from Linear or Notion",
  footnote: "You can rename, archive, or delete a project anytime.",
};

export interface FirstProjectProps {
  /** Open your create-project flow. */
  onCreateProject: () => void;
  /** Open your import flow. The import button only shows when this is given. */
  onImport?: () => void;
  className?: string;
}

function FirstProjectScreen({
  onCreateProject,
  onImport,
  className,
}: FirstProjectProps) {
  const t = useMessages("firstProject", FIRST_PROJECT_MESSAGES);
  return (
    <Empty className={cn("w-full", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderPlusIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{t.title}</EmptyTitle>
        <EmptyDescription>{t.description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button className="w-full max-w-xs" onClick={onCreateProject} size="lg">
          {t.create}
          <ArrowRightIcon />
        </Button>
        {onImport ? (
          <>
            <div className="flex w-full max-w-xs items-center gap-3 text-muted-foreground text-xs">
              <Separator className="flex-1" />
              <span className="font-mono uppercase tracking-[0.3em]">
                {t.or}
              </span>
              <Separator className="flex-1" />
            </div>
            <Button
              className="w-full max-w-xs"
              onClick={onImport}
              size="lg"
              variant="outline"
            >
              <ImportIcon />
              {t.import}
            </Button>
          </>
        ) : null}
        <p className="pt-2 text-muted-foreground text-xs">{t.footnote}</p>
      </EmptyContent>
    </Empty>
  );
}

export function FirstProject(props: FirstProjectProps) {
  return (
    <ScreenBoundary name="FirstProject">
      <FirstProjectScreen {...props} />
    </ScreenBoundary>
  );
}
