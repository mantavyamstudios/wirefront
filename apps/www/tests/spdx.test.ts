// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/** Every source file carries its licence header (see scripts/spdx.ts). */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { headerLines, missingHeaders, withHeader } from "../../../scripts/spdx";

describe("SPDX headers", () => {
  it("are present in every source file", () => {
    expect(missingHeaders()).toEqual([]);
  });

  it("credit devl.dev and Wirefront correctly", () => {
    expect(headerLines("packages/ui/src/components/ui/segmented-control.tsx", "")[1]).toContain("Mantavyam Studios");
    expect(headerLines("apps/www/src/x.tsx", "// Ported from devl.dev (…)")[2]).toContain("Sean Brydon");
    expect(headerLines("apps/www/src/x.tsx", "")).toHaveLength(2);
  });

  it("mark every UI kit component as shadcn/ui (MIT) or Wirefront (AGPL), with no coss ui left", () => {
    const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../packages/ui/src/components/ui");
    const wrong = readdirSync(dir).filter((f) => {
      const head = readFileSync(path.join(dir, f), "utf8").split("\n").slice(0, 3).join("\n");
      const shadcn = head.includes("SPDX-License-Identifier: MIT") && head.includes("shadcn/ui");
      const wirefront = head.includes("SPDX-License-Identifier: AGPL-3.0-only") && head.includes("Mantavyam Studios");
      return !(shadcn || wirefront) || /cal\.com|coss/i.test(head);
    });
    expect(wrong).toEqual([]);
  });

  it("keep a shebang first and are added only once", () => {
    const once = withHeader("scripts/x.ts", "#!/usr/bin/env tsx\nconsole.log(1);\n");
    expect(once.startsWith("#!/usr/bin/env tsx\n// SPDX-License-Identifier: AGPL-3.0-only\n")).toBe(true);
    expect(withHeader("scripts/x.ts", once)).toBe(once);
  });
});
