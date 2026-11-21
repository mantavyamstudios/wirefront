import { loader } from "fumadocs-core/source";
import type { InferMetaType, InferPageType } from "fumadocs-core/source";
import { Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createElement } from "react";

import { docs } from "@/.source";
import { LucideIcons } from "@/components/lucide-icons";
import { attachFile } from "@/lib/docs/attach-file";
import { attachSeparator } from "@/lib/docs/attach-separator";

// Icons that docs frontmatter and meta.json files may name ("icon": "…").
// Add an entry here to use another lucide icon.
const PAGE_ICONS: Record<string, LucideIcon> = { Workflow };

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  pageTree: {
    attachFile,
    attachSeparator,
  },
  icon(icon) {
    if (!icon) {
      return;
    }
    if (icon === "LucideIcons") {
      return createElement(LucideIcons);
    }
    const Icon = PAGE_ICONS[icon];
    if (!Icon) {
      console.warn(
        `Docs icon "${icon}" is not in PAGE_ICONS (lib/docs/source.ts); it is not shown.`
      );
      return;
    }
    return createElement(Icon);
  },
});

export type Page = InferPageType<typeof source>;
export type Meta = InferMetaType<typeof source>;
