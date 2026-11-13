// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { ArrowRightIcon, FolderPlusIcon, ImportIcon } from "lucide-react";
import { Button } from "@wirefront/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@wirefront/ui/empty";
import { Separator } from "@wirefront/ui/separator";

export function EmptyFirstProject() {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-border/60 border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-foreground" />
            <span className="tracking-[0.2em] uppercase">Workspace</span>
            <span className="text-muted-foreground">/ mantavyam</span>
          </div>
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
            Day 1
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl items-center px-6 py-16 lg:py-24">
        <Empty className="w-full">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderPlusIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>Start your first project.</EmptyTitle>
            <EmptyDescription>
              A project is where you'll keep tasks, docs, and assets. Most
              teams start with one and split things out later.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="lg" className="w-full max-w-xs">
              Create project
              <ArrowRightIcon />
            </Button>
            <div className="flex items-center gap-3 text-muted-foreground text-xs">
              <Separator className="flex-1" />
              <span className="font-mono uppercase tracking-[0.3em]">or</span>
              <Separator className="flex-1" />
            </div>
            <Button variant="outline" size="lg" className="w-full max-w-xs">
              <ImportIcon />
              Import from Linear or Notion
            </Button>
            <p className="pt-2 text-muted-foreground text-xs">
              You can rename, archive, or delete a project anytime.
            </p>
          </EmptyContent>
        </Empty>
      </main>
    </div>
  );
}
