// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ListedProduct, ProductCategory, ProductColor, ProductFacetCounts, ProductsPage } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const listCategories: ProductCategory[] = [
  { id: "apparel", label: "Apparel" },
  { id: "drinkware", label: "Drinkware" },
  { id: "stationery", label: "Stationery" },
  { id: "hardware", label: "Hardware" },
  { id: "home", label: "Home & garden" },
  { id: "games", label: "Games" },
];

export const listColors: ProductColor[] = [
  { id: "bone", label: "Bone", swatch: "#e7e5e4" },
  { id: "moss", label: "Moss", swatch: "#065f46" },
  { id: "dune", label: "Dune", swatch: "#fcd34d" },
  { id: "night", label: "Night", swatch: "#18181b" },
  { id: "rust", label: "Rust", swatch: "#9a3412" },
  { id: "sky", label: "Sky", swatch: "#38bdf8" },
];

/** Products with the fields only the demo backend filters on. */
export const products: (ListedProduct & { category: string; freeShipping: boolean })[] = [
  { id: "p01", name: "Specimen Tee", category: "apparel", price: 38, colors: ["bone", "night"], rating: 4.6, inStock: true, onSale: true, freeShipping: true, isNew: false },
  { id: "p02", name: "Lab Hoodie", category: "apparel", price: 92, colors: ["moss", "night"], rating: 4.8, inStock: true, onSale: false, freeShipping: true, isNew: true },
  { id: "p03", name: "Field Cap", category: "apparel", price: 26, colors: ["dune", "rust"], rating: 4.4, inStock: true, onSale: false, freeShipping: false, isNew: false },
  { id: "p04", name: "Type Cardigan", category: "apparel", price: 142, colors: ["bone"], rating: 4.9, inStock: false, onSale: false, freeShipping: true, isNew: true },
  { id: "p05", name: "Ceramic Mug", category: "drinkware", price: 22, colors: ["bone", "night"], rating: 4.7, inStock: true, onSale: false, freeShipping: false, isNew: false },
  { id: "p06", name: "Vacuum Flask", category: "drinkware", price: 36, colors: ["sky", "night"], rating: 4.5, inStock: true, onSale: true, freeShipping: true, isNew: false },
  { id: "p07", name: "Espresso Cup", category: "drinkware", price: 14, colors: ["bone"], rating: 4.2, inStock: true, onSale: false, freeShipping: false, isNew: true },
  { id: "p08", name: "Field Notes vol.4", category: "stationery", price: 14, colors: ["dune"], rating: 4.9, inStock: true, onSale: false, freeShipping: true, isNew: true },
  { id: "p09", name: "Brass Pen", category: "stationery", price: 48, colors: ["dune", "rust"], rating: 4.7, inStock: false, onSale: false, freeShipping: true, isNew: false },
  { id: "p10", name: "Specimen Notebook", category: "stationery", price: 22, colors: ["bone", "moss"], rating: 4.4, inStock: true, onSale: true, freeShipping: false, isNew: false },
  { id: "p11", name: "Mech Keyboard", category: "hardware", price: 168, colors: ["night"], rating: 4.8, inStock: true, onSale: false, freeShipping: true, isNew: true },
  { id: "p12", name: "Trackball", category: "hardware", price: 88, colors: ["bone", "night"], rating: 4.3, inStock: true, onSale: false, freeShipping: true, isNew: false },
  { id: "p13", name: "USB-C Hub", category: "hardware", price: 56, colors: ["night"], rating: 4.6, inStock: true, onSale: true, freeShipping: false, isNew: false },
  { id: "p14", name: "Laser Pointer", category: "hardware", price: 32, colors: ["sky"], rating: 3.9, inStock: false, onSale: false, freeShipping: false, isNew: false },
  { id: "p15", name: "Linen Throw", category: "home", price: 78, colors: ["bone", "moss"], rating: 4.7, inStock: true, onSale: false, freeShipping: true, isNew: true },
  { id: "p16", name: "Ceramic Planter", category: "home", price: 28, colors: ["bone", "rust"], rating: 4.5, inStock: true, onSale: true, freeShipping: false, isNew: false },
  { id: "p17", name: "Brass Candlestick", category: "home", price: 52, colors: ["dune"], rating: 4.6, inStock: true, onSale: false, freeShipping: true, isNew: false },
  { id: "p18", name: "Wool Blanket", category: "home", price: 124, colors: ["moss", "rust"], rating: 4.8, inStock: false, onSale: false, freeShipping: true, isNew: true },
  { id: "p19", name: "Chess Set", category: "games", price: 88, colors: ["bone", "night"], rating: 4.7, inStock: true, onSale: false, freeShipping: true, isNew: false },
  { id: "p20", name: "Card Deck", category: "games", price: 12, colors: ["sky"], rating: 4.4, inStock: true, onSale: true, freeShipping: false, isNew: false },
  { id: "p21", name: "Field Towel", category: "apparel", price: 18, colors: ["bone", "sky"], rating: 4.1, inStock: true, onSale: false, freeShipping: false, isNew: true },
  { id: "p22", name: "Brass Compass", category: "hardware", price: 64, colors: ["dune"], rating: 4.6, inStock: true, onSale: false, freeShipping: true, isNew: false },
  { id: "p23", name: "Type Print", category: "home", price: 42, colors: ["bone"], rating: 4.5, inStock: true, onSale: false, freeShipping: false, isNew: true },
  { id: "p24", name: "Domino Set", category: "games", price: 24, colors: ["dune", "moss"], rating: 4.2, inStock: true, onSale: false, freeShipping: false, isNew: false },
];

/** Per-category and per-minimum-rating counts over `all`; what a backend's counts would be. */
export function countFacets(all: typeof products): ProductFacetCounts {
  const category: Record<string, number> = {};
  for (const p of all) category[p.category] = (category[p.category] ?? 0) + 1;
  const ratingMin = Object.fromEntries([5, 4, 3].map((min) => [String(min), all.filter((p) => p.rating >= min).length]));
  return { category, ratingMin };
}

/** What the mocks return for `listProducts`. */
export const listProducts: ProductsPage = {
  items: products.slice(0, 6).map(({ category: _c, freeShipping: _f, ...p }) => p),
  total: 6,
  overall: products.length,
  counts: countFacets(products),
};
