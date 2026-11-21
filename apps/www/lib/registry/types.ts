import type { InferPageType } from "fumadocs-core/source";

import type { source } from "@/lib/docs/source";

export type PrimitiveDocPage = InferPageType<typeof source>;

/** `(string & Record<never, never>)` lets other catalogues (e.g. `/screens`) reuse these types. */
export type ComponentCollection =
  | "component"
  | "block"
  | "showcase"
  | (string & Record<never, never>);

export interface RegistryInspiration {
  label: string;
  type: "inspired" | "reimplemented" | "adapted";
  url?: string;
}

export interface ComponentTocItem {
  depth: number;
  title: string;
  url: string;
}

export interface ComponentPageHeaderData {
  author?: {
    name: string;
    url?: string;
  };
  collection: ComponentCollection;
  componentUrl: string;
  description: string;
  docsUrl: string;
  title: string;
}

export type ComponentGalleryCategory =
  | "texts"
  | "buttons"
  | "effects"
  | "disclosure"
  | "components"
  | (string & Record<never, never>);

export interface ComponentGalleryCardPreview {
  poster?: string;
  videoMp4?: string;
  videoWebm?: string;
}

export interface ComponentGalleryItem {
  /** Poster + optional hover video sources for gallery cards. */
  cardPreview?: ComponentGalleryCardPreview;
  category?: ComponentGalleryCategory;
  collection: ComponentCollection;
  description: string;
  href: string;
  releaseDate?: string;
  slug: string;
  title: string;
}
