"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import type { CommandPaletteGroup } from "@/lib/command-palette/types";

const CommandPaletteGroupsContext = createContext<CommandPaletteGroup[]>([]);

export const CommandPaletteGroupsProvider = ({
  children,
  groups,
}: {
  children: ReactNode;
  groups: CommandPaletteGroup[];
}) => (
  <CommandPaletteGroupsContext.Provider value={groups}>
    {children}
  </CommandPaletteGroupsContext.Provider>
);

export const useCommandPaletteGroups = (): CommandPaletteGroup[] =>
  useContext(CommandPaletteGroupsContext);
