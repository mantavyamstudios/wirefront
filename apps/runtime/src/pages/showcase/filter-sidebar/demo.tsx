// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the sidebar over an in-memory backend, in sample page chrome.
// Not shipped by the registry; builders wire ProductFilterSidebar to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useMemo, useState } from "react";
import * as fixtures from "./fixtures";
import { ProductFilterSidebar, type ProductsListQuery } from "./view";

/** What a backend's listProducts would do with the query. */
function runQuery(query: ProductsListQuery) {
  const f = query.filters ?? {};
  const items = fixtures.products.filter(
    (p) =>
      (!f.category?.length || f.category.includes(p.category)) &&
      (!f.color?.length || p.colors.some((c) => f.color?.includes(c))) &&
      (f.priceMin === undefined || p.price >= f.priceMin) &&
      (f.priceMax === undefined || p.price <= f.priceMax) &&
      (!f.ratingMin || p.rating >= f.ratingMin) &&
      (!f.inStock || p.inStock) &&
      (!f.onSale || p.onSale) &&
      (!f.freeShipping || p.freeShipping) &&
      (!f.isNew || p.isNew)
  );
  const start = (query.page - 1) * query.pageSize;
  return {
    items: items.slice(start, start + query.pageSize),
    total: items.length,
  };
}

const counts = fixtures.countFacets(fixtures.products);

export function FilterSidebarShowcasePage() {
  const [query, setQuery] = useState<ProductsListQuery>({
    page: 1,
    pageSize: 24,
  });
  const page = useMemo(() => runQuery(query), [query]);
  return (
    <WirefrontProvider currency="USD">
      <div className="min-h-svh bg-background">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-12">
          <ProductFilterSidebar
            categories={fixtures.listCategories}
            colors={fixtures.listColors}
            counts={counts}
            onQueryChange={setQuery}
            overall={fixtures.products.length}
            products={page.items}
            query={query}
            total={page.total}
          />
        </div>
      </div>
    </WirefrontProvider>
  );
}
