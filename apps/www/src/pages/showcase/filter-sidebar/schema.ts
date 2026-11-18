// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ProductCategory = z.object({ id: z.string(), label: z.string() }).meta({ id: "ProductCategory" });
export type ProductCategory = z.infer<typeof ProductCategory>;

/** A colour option; `swatch` is any CSS colour. */
export const ProductColor = z.object({ id: z.string(), label: z.string(), swatch: z.string() }).meta({ id: "ProductColor" });
export type ProductColor = z.infer<typeof ProductColor>;

export const ListedProduct = z
  .object({
    id: z.string(),
    name: z.string(),
    /** In the provider's currency, major units. */
    price: z.number().min(0),
    /** Colour ids. */
    colors: z.array(z.string()),
    /** 0–5. */
    rating: z.number().min(0).max(5),
    inStock: z.boolean(),
    onSale: z.boolean(),
    isNew: z.boolean(),
    imageUrl: z.url().optional(),
  })
  .meta({ id: "ListedProduct" });
export type ListedProduct = z.infer<typeof ListedProduct>;

/** The sidebar's filters. Absent means no filter. Within categories and colours, any match counts. */
export const ProductFilters = z
  .object({
    category: z.array(z.string()).optional(),
    color: z.array(z.string()).optional(),
    priceMin: z.number().min(0).optional(),
    priceMax: z.number().min(0).optional(),
    /** Rated at least this. */
    ratingMin: z.int().min(1).max(5).optional(),
    inStock: z.literal(true).optional(),
    onSale: z.literal(true).optional(),
    freeShipping: z.literal(true).optional(),
    isNew: z.literal(true).optional(),
  })
  .meta({ id: "ProductFilters" });
export type ProductFilters = z.infer<typeof ProductFilters>;

/** How many products have each category, and each minimum rating. */
export const ProductFacetCounts = z
  .object({ category: z.record(z.string(), z.int().min(0)), ratingMin: z.record(z.string(), z.int().min(0)) })
  .meta({ id: "ProductFacetCounts" });
export type ProductFacetCounts = z.infer<typeof ProductFacetCounts>;

/** The list query as query-string parameters (arrays repeat the key). */
export const ProductsQuery = z
  .object({ page: z.int().min(1), pageSize: z.int().min(1).max(100) })
  .extend(ProductFilters.shape)
  .meta({ id: "ProductsQuery" });
export type ProductsQuery = z.infer<typeof ProductsQuery>;

export const ProductsPage = z
  .object({ items: z.array(ListedProduct), total: z.int().min(0), overall: z.int().min(0), counts: ProductFacetCounts })
  .meta({ id: "ProductsPage" });
export type ProductsPage = z.infer<typeof ProductsPage>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listProducts: {
    method: "GET",
    path: "/products",
    summary: "One page of products matching the filters, with facet counts",
    query: ProductsQuery,
    response: ProductsPage,
  },
  listCategories: { method: "GET", path: "/products/categories", summary: "The categories to filter by", response: z.array(ProductCategory) },
  listColors: { method: "GET", path: "/products/colors", summary: "The colours to filter by", response: z.array(ProductColor) },
});
