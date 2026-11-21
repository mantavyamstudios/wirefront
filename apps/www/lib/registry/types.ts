import type { InferPageType } from "fumadocs-core/source";

import type { source } from "@/lib/docs/source";

export type PrimitiveDocPage = InferPageType<typeof source>;

/** `(string & Record<never, never>)` lets other catalogues (e.g. `/flows`) reuse these types. */
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
  /** Two-screen flow card used on `/flows` (screens + tapped point on screen 1). */
  flow?: { screens: string[]; tap?: { x: number; y: number } };
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
  /** @deprecated Use `cardPreview.videoMp4` instead. */
  previewVideo?: string;
  releaseDate?: string;
  slug: string;
  title: string;
}
