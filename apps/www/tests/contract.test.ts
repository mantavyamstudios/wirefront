// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/** The contract checker (scripts/lib/contract.ts) and every ready-to-wire screen. */
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkScreenFolder, checkView, readyScreens, SHOWCASE_DIR } from "../../../scripts/lib/contract";

const HEADER = "// SPDX-License-Identifier: AGPL-3.0-only\n// Wirefront © 2026 Mantavyam Studios\n";

const GOOD = `${HEADER}"use client";

import type { Member } from "./schema";

const ROLE_CLASS = { owner: "text-foreground", member: "text-muted-foreground" };

export interface MembersTableProps {
  members: Member[];
  onRemove: (id: string) => Promise<void>;
}

// Comments may mention fetch(), Math.random() or new Date() freely.
export function MembersTable({ members, onRemove }: MembersTableProps) {
  const joined = (m: Member) => new Date(m.joinedAt);
  return null;
}
`;

const rules = (src: string) => checkView(src).map((v) => v.rule);

describe("checkView", () => {
  it("accepts a view that follows the contract", () => {
    expect(checkView(GOOD)).toEqual([]);
  });

  it("requires 'use client', the licence header and an exported Props type", () => {
    const bare = 'export function X() { return null; }\n';
    expect(rules(bare).sort()).toEqual(["licence", "props", "use-client"]);
  });

  it("rejects framework imports and fetching in the view", () => {
    const src = GOOD.replace(
      'import type { Member } from "./schema";',
      'import Link from "next/link";\nimport { useNavigate } from "@tanstack/react-router";\nimport { useQuery } from "@tanstack/react-query";',
    ).replace("return null;", 'void fetch("/api/members");\n  return null;');
    expect(rules(src).sort()).toEqual(["fetching", "fetching", "framework", "framework"]);
  });

  it("rejects fake latency, hard-coded records and non-deterministic render", () => {
    const src = GOOD.replace(
      "const ROLE_CLASS",
      'const MEMBERS = [{ id: "1", name: "Ada" }];\nconst wait = (ms: number) => new Promise((r) => setTimeout(r, ms));\nconst ROLE_CLASS',
    ).replace("return null;", "const id = Math.random();\n  const now = Date.now();\n  const today = new Date();\n  return null;");
    expect(rules(src).sort()).toEqual(["deterministic", "deterministic", "deterministic", "fake-latency", "hard-coded-data"]);
    expect(checkView(src).find((v) => v.rule === "hard-coded-data")?.line).toBe(7);
  });
});

describe("ready-to-wire screens", () => {
  const screens = readyScreens();

  it.each(screens.length ? screens : ["(none yet)"])("%s follows the screen contract", (screen) => {
    if (screen === "(none yet)") return;
    expect(checkScreenFolder(join(SHOWCASE_DIR, screen))).toEqual([]);
  });
});
