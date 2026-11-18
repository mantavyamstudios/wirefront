// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ShopProduct = z
  .object({
    id: z.string(),
    name: z.string(),
    /** e.g. "Lab series · 350ml". */
    subtitle: z.string().optional(),
    /** In `currency` major units. */
    price: z.number().min(0),
    /** The old price, when it's on sale. */
    compareAtPrice: z.number().min(0).optional(),
    currency: z.string().length(3),
    rating: z.number().min(0).max(5),
    reviewCount: z.int().min(0),
    /** Available colours; `swatch` is any CSS colour. */
    colors: z.array(z.object({ name: z.string(), swatch: z.string() })),
    tag: z.enum(["new", "sale"]).optional(),
    imageUrl: z.url().optional(),
    href: z.string(),
    wishlisted: z.boolean(),
  })
  .meta({ id: "ShopProduct" });
export type ShopProduct = z.infer<typeof ShopProduct>;

export const WishlistInput = z.object({ productId: z.string(), saved: z.boolean() }).meta({ id: "WishlistInput" });
export type WishlistInput = z.infer<typeof WishlistInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listCollection: {
    method: "GET",
    path: "/collections/{id}/products",
    summary: "Products in a collection",
    params: z.object({ id: z.string() }),
    response: z.object({ items: z.array(ShopProduct), total: z.int().min(0) }),
  },
  addToBag: { method: "POST", path: "/bag/items", summary: "Add one of a product to the bag", body: z.object({ productId: z.string(), quantity: z.int().min(1) }) },
  setWishlisted: { method: "PUT", path: "/me/wishlist/{productId}", summary: "Save or unsave a product", params: z.object({ productId: z.string() }), body: WishlistInput.pick({ saved: true }) },
});
