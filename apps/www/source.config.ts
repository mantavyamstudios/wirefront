import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from "fumadocs-mdx/config";
import lastModified from "fumadocs-mdx/plugins/last-modified";
import { z } from "zod/v4";

import { gitLastModifiedForFile } from "./lib/docs/git-last-modified";

const blocksDocSchema = frontmatterSchema.extend({
  /** Overrides git `lastModified` for the 10-day "new" badge only. */
  releaseDate: z.coerce.date().optional(),
  beta: z.boolean().optional(),
  alpha: z.boolean().optional(),
  updated: z.boolean().optional(),
  deprecated: z.boolean().optional(),
  author: z
    .object({
      name: z.string(),
      url: z.string().optional(),
    })
    .optional(),
  /** Registry item name when it differs from the MDX slug. */
  registryName: z.string().optional(),
  /** Registry preview entry override (e.g. demo-*). */
  preview: z.string().optional(),
  /** Gallery card poster + hover video preview assets. */
  cardPreview: z
    .object({
      poster: z.string().optional(),
      videoWebm: z.string().optional(),
      videoMp4: z.string().optional(),
    })
    .optional(),
});

const blocksDocPostprocess = {
  includeProcessedMarkdown: true,
} as const;

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.vercel.app/docs/mdx/collections#define-docs
export const docs = defineDocs({
  docs: {
    schema: blocksDocSchema,
    postprocess: blocksDocPostprocess,
  },
  meta: {
    schema: metaSchema,
  },
});

/**
 * Wirefront screens — served at `/<group>/<kind>/<screen>`. Pages are
 * generated from the screens catalogue by `scripts/screens-manifest.mts`.
 */
export const screens = defineDocs({
  dir: "content/screens",
  docs: {
    schema: blocksDocSchema,
    postprocess: blocksDocPostprocess,
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    // remarkStructure writes to vfile.data; export it for search indexing.
    valueToExport: ["structuredData"],
  },
  plugins: [lastModified({ versionControl: gitLastModifiedForFile })],
});
