// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/** Every source file carries its licence header (see scripts/spdx.ts). */
import { describe, expect, it } from "vitest";
import { headerLines, missingHeaders, withHeader } from "../../../scripts/spdx";

describe("SPDX headers", () => {
  it("are present in every source file", () => {
    expect(missingHeaders()).toEqual([]);
  });

  it("credit coss ui, devl.dev and Wirefront correctly", () => {
    expect(headerLines("packages/ui/src/components/ui/button.tsx", "")[1]).toContain("Cal.com");
    expect(headerLines("packages/ui/src/components/ui/auth-split-layout.tsx", "")[1]).toContain("Mantavyam Studios");
    expect(headerLines("apps/www/src/x.tsx", "// Ported from devl.dev (…)")[2]).toContain("Sean Brydon");
    expect(headerLines("apps/www/src/x.tsx", "")).toHaveLength(2);
  });

  it("keep a shebang first and are added only once", () => {
    const once = withHeader("scripts/x.ts", "#!/usr/bin/env tsx\nconsole.log(1);\n");
    expect(once.startsWith("#!/usr/bin/env tsx\n// SPDX-License-Identifier: AGPL-3.0-only\n")).toBe(true);
    expect(withHeader("scripts/x.ts", once)).toBe(once);
  });
});
