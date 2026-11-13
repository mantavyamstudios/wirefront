// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/** The contract checker (scripts/lib/contract.ts) and every ready-to-wire screen. */
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { ApiContract } from "@wirefront/ui/wirefront/api";
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

export function MembersTableBoundary(props: MembersTableProps) {
  return <ScreenBoundary name="MembersTable"><MembersTable {...props} /></ScreenBoundary>;
}
`;

const rules = (src: string) => checkView(src).map((v) => v.rule);

describe("checkView", () => {
  it("accepts a view that follows the contract", () => {
    expect(checkView(GOOD)).toEqual([]);
  });

  it("requires 'use client', the licence header and an exported Props type", () => {
    const bare = 'export function X() { return null; }\n';
    expect(rules(bare).sort()).toEqual(["boundary", "licence", "props", "use-client"]);
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

describe("screen boundary", () => {
  it("requires screens to render inside ScreenBoundary, except frames that take the page as children", () => {
    const unguarded = GOOD.replace(/\nexport function MembersTableBoundary[\s\S]*$/, "\n");
    expect(rules(unguarded)).toEqual(["boundary"]);
    const frame = unguarded.replace("members: Member[];", "members: Member[];\n  children: ReactNode;");
    expect(rules(frame)).toEqual([]);
  });
});

describe("placeholder links and autofill", () => {
  const withMarkup = (jsx: string) => GOOD.replace("return null;", `return (${jsx});`);

  it("rejects href=\"#\" and accepts a real href", () => {
    expect(rules(withMarkup('<a href="#">Terms</a>'))).toEqual(["placeholder-link"]);
    expect(rules(withMarkup("<a href={termsHref}>Terms</a>"))).toEqual([]);
  });

  it("requires autoComplete on email, password and tel inputs, in any attribute order", () => {
    expect(rules(withMarkup('<Input type="email" name="email" />'))).toEqual(["autocomplete"]);
    expect(rules(withMarkup('<Field.Control name="pw" type="password" />'))).toEqual(["autocomplete"]);
    expect(rules(withMarkup('<input type="tel" />'))).toEqual(["autocomplete"]);
    expect(rules(withMarkup('<Input autoComplete="email" type="email" />'))).toEqual([]);
    expect(rules(withMarkup('<Input type="password" autoComplete="new-password" />'))).toEqual([]);
    expect(rules(withMarkup('<Input type="text" />'))).toEqual([]);
  });
});

describe("link-as-button", () => {
  it("rejects a Button rendered as a link and accepts a styled link", () => {
    const button = GOOD.replace("return null;", 'return <Button nativeButton={false} render={<WirefrontLink href="/x" />}>Go</Button>;');
    expect(rules(button)).toEqual(["link-as-button"]);
    const link = GOOD.replace("return null;", 'return <WirefrontLink className={buttonVariants()} href="/x">Go</WirefrontLink>;');
    expect(rules(link)).toEqual([]);
  });
});

describe("ready-to-wire screens", () => {
  const screens = readyScreens();

  it.each(screens.length ? screens : ["(none yet)"])("%s follows the screen contract", (screen) => {
    if (screen === "(none yet)") return;
    expect(checkScreenFolder(join(SHOWCASE_DIR, screen))).toEqual([]);
  });

  // Every operation that returns a body has a fixture named after it: the
  // mocks answer with it, so it must match the response schema.
  it.each(screens.length ? screens : ["(none yet)"])("%s has fixtures that match its API", async (screen) => {
    if (screen === "(none yet)") return;
    const { api } = (await import(join(SHOWCASE_DIR, screen, "schema.ts"))) as { api: ApiContract };
    const fixtures = (await import(join(SHOWCASE_DIR, screen, "fixtures.ts"))) as Record<string, unknown>;
    const problems: string[] = [];
    for (const [name, op] of Object.entries(api)) {
      if (!op.response) continue;
      const fixture = fixtures[name];
      if (fixture === undefined || typeof fixture === "function") {
        problems.push(`${name}: no fixture value named "${name}" for its response`);
        continue;
      }
      const parsed = op.response.safeParse(fixture);
      if (!parsed.success) problems.push(`${name}: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
    }
    expect(problems).toEqual([]);
  });
});
