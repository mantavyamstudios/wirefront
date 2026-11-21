// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ShopProduct } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const products: ShopProduct[] = [
  {
    id: "orbit-mug",
    name: "Orbit ceramic mug",
    subtitle: "Lab series · 350ml",
    price: 22,
    currency: "USD",
    rating: 4.8,
    reviewCount: 124,
    colors: [
      { name: "Night", swatch: "#1f1f1f" },
      { name: "Stone", swatch: "#d6d3d1" },
      { name: "Violet", swatch: "#7c3aed" },
    ],
    tag: "new",
    href: "#orbit-mug",
    wishlisted: false,
  },
  {
    id: "orbit-tee",
    name: "Type specimen tee",
    subtitle: "Garment-dyed cotton",
    price: 38,
    compareAtPrice: 48,
    currency: "USD",
    rating: 4.6,
    reviewCount: 312,
    colors: [
      { name: "Navy", swatch: "#0f172a" },
      { name: "Lime", swatch: "#84cc16" },
      { name: "Amber", swatch: "#f59e0b" },
      { name: "Rose", swatch: "#e11d48" },
    ],
    tag: "sale",
    href: "#orbit-tee",
    wishlisted: true,
  },
  {
    id: "orbit-zine",
    name: "Field notes vol. 04",
    subtitle: "104 pp · soft cover",
    price: 14,
    currency: "USD",
    rating: 4.9,
    reviewCount: 47,
    colors: [
      { name: "Slate", swatch: "#1e293b" },
      { name: "Cream", swatch: "#fef3c7" },
    ],
    href: "#orbit-zine",
    wishlisted: false,
  },
];

/** What the mocks return for `listCollection`. */
export const listCollection = { items: products, total: 24 };
