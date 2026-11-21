"use client";

import { cn } from "@workspace/ui/lib/utils";
import type * as React from "react";

export const DocsShellSectionTitle = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "text-foreground/40 px-0 py-3.5 text-sm font-medium",
      className
    )}
  >
    {children}
  </div>
);

export const DocsShellSection = ({
  label,
  children,
  className,
}: {
  label?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex flex-col", className)}>
    {label && <DocsShellSectionTitle>{label}</DocsShellSectionTitle>}
    {children}
  </div>
);
