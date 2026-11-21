// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@wirefront/ui/card";
import { cn } from "@wirefront/ui/lib/utils";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { CheckIcon, HeartIcon, ShoppingBagIcon, StarIcon } from "lucide-react";
import { useState } from "react";

import type { ShopProduct, WishlistInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("productCards.<key>"). */
export const PRODUCT_CARDS_MESSAGES = {
  title: "Shop",
  count: "{shown} of {total} items",
  new: "New",
  sale: "Sale",
  wishlist: "Save {name} to wishlist",
  colors: "Colours: {names}",
  rating: "Rated {rating} out of 5 from {count} reviews",
  wasPrice: "Was",
  addToBag: "Add to bag",
  added: "Added",
};

export interface ProductCardsProps {
  products: ShopProduct[];
  /** How many products the collection has in all. */
  total?: number;
  /** The collection's name, after the title, e.g. "spring drop". */
  collection?: string;
  /** Add one to the bag (addToBag). Hidden without it. */
  onAddToBag?: Action<string>;
  /** Save or unsave (setWishlisted). Applied at once and rolled back if it fails. Hidden without it. */
  onWishlist?: Action<WishlistInput>;
  className?: string;
}

const COVERS = [
  "radial-gradient(120% 100% at 30% 20%, color-mix(in srgb, var(--category-3) 55%, transparent), transparent 60%), radial-gradient(120% 100% at 80% 80%, color-mix(in srgb, var(--category-4) 70%, transparent), transparent 60%)",
  "radial-gradient(120% 100% at 30% 20%, color-mix(in srgb, var(--category-2) 45%, transparent), transparent 60%), radial-gradient(120% 100% at 80% 80%, color-mix(in srgb, var(--category-8) 70%, transparent), transparent 60%)",
  "radial-gradient(120% 100% at 30% 20%, color-mix(in srgb, var(--category-4) 35%, transparent), transparent 60%), radial-gradient(120% 100% at 80% 80%, color-mix(in srgb, var(--category-5) 70%, transparent), transparent 60%)",
];

/** Whole amounts drop the ".00"; works on older Intl type libs without trailingZeroDisplay. */
const wholeAmount = (n: number): Intl.NumberFormatOptions | undefined => (Number.isInteger(n) ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : undefined);

function ProductCardsScreen({ products, total, collection, onAddToBag, onWishlist, className }: ProductCardsProps) {
  const t = useMessages("productCards", PRODUCT_CARDS_MESSAGES);
  const format = useFormat();
  const [wished, setWished] = useState<Record<string, boolean>>({});
  const [added, setAdded] = useState<string>();
  const add = useAction(onAddToBag ?? (async () => {}), { onSuccess: (_, id) => setAdded(id) });
  const wish = useAction(onWishlist ?? (async () => {}), {
    optimistic: ({ productId, saved }) => {
      setWished((w) => ({ ...w, [productId]: saved }));
      return () => setWished((w) => ({ ...w, [productId]: !saved }));
    },
  });
  const failure = add.error ?? wish.error;

  return (
    <div className={cn("min-h-svh bg-background px-4 py-8 sm:px-6 sm:py-12", className)}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <h1 className="font-heading text-xl">
            {t.title}
            {collection ? <> · {collection}</> : null}
          </h1>
          {total !== undefined ? <p className="text-muted-foreground text-sm">{interpolate(t.count, { shown: products.length, total: format.number(total) })}</p> : null}
        </header>
        {failure ? (
          <p className="mb-3 text-destructive-foreground text-sm" role="alert">
            {failure}
          </p>
        ) : null}

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => {
            const isWished = wished[p.id] ?? p.wishlisted;
            return (
              <li key={p.id}>
                <Card className="h-full overflow-hidden">
                  <div className="relative aspect-[4/3] w-full bg-muted" style={p.imageUrl ? undefined : { background: `${COVERS[i % COVERS.length]}, var(--muted)` }}>
                    {p.imageUrl ? <img alt="" className="size-full object-cover" src={p.imageUrl} /> : null}
                    {p.tag ? (
                      <Badge className="absolute start-3 top-3 font-mono text-[10px] uppercase tracking-wider" variant="secondary">
                        {t[p.tag]}
                      </Badge>
                    ) : null}
                    {onWishlist ? (
                      <Button
                        aria-label={interpolate(t.wishlist, { name: p.name })}
                        aria-pressed={isWished}
                        className="absolute end-2 top-2 rounded-full bg-background/80 backdrop-blur"
                        disabled={wish.isPending(p.id)}
                        onClick={() => void wish.run({ productId: p.id, saved: !isWished }, p.id)}
                        size="icon-sm"
                        variant="outline"
                      >
                        <HeartIcon className={cn(isWished && "fill-current text-destructive")} />
                      </Button>
                    ) : null}
                    {p.colors.length ? (
                      <ul aria-label={interpolate(t.colors, { names: p.colors.map((c) => c.name).join(", ") })} className="absolute end-3 bottom-3 flex items-center gap-1">
                        {p.colors.map((c) => (
                          <li aria-hidden className="size-3.5 rounded-full border border-foreground/10 shadow-sm" key={c.name} style={{ background: c.swatch }} title={c.name} />
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="font-heading text-base">
                        <h2>
                          <WirefrontLink className="rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring" href={p.href}>
                            {p.name}
                          </WirefrontLink>
                        </h2>
                      </CardTitle>
                      <div className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
                        <StarIcon aria-hidden className="size-3 fill-current text-foreground/70" />
                        <span aria-hidden>
                          {format.number(p.rating, { maximumFractionDigits: 1 })} ({format.number(p.reviewCount)})
                        </span>
                        <span className="sr-only">{interpolate(t.rating, { rating: format.number(p.rating, { maximumFractionDigits: 1 }), count: format.number(p.reviewCount) })}</span>
                      </div>
                    </div>
                    {p.subtitle ? <p className="text-muted-foreground text-sm">{p.subtitle}</p> : null}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-baseline gap-2">
                      <div className="font-heading font-semibold text-lg">{format.money(p.price, p.currency, wholeAmount(p.price))}</div>
                      {p.compareAtPrice ? (
                        <del className="text-muted-foreground text-sm">
                          <span className="sr-only">{t.wasPrice} </span>
                          {format.money(p.compareAtPrice, p.currency, wholeAmount(p.compareAtPrice))}
                        </del>
                      ) : null}
                    </div>
                  </CardContent>
                  {onAddToBag ? (
                    <CardFooter className="border-t">
                      <Button aria-busy={add.isPending(p.id)} className="w-full" disabled={add.isPending(p.id)} onClick={() => void add.run(p.id, p.id)}>
                        {add.isPending(p.id) ? <Spinner data-icon="inline-start" /> : added === p.id ? <CheckIcon /> : <ShoppingBagIcon />}
                        {added === p.id ? t.added : t.addToBag}
                      </Button>
                    </CardFooter>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function ProductCards(props: ProductCardsProps) {
  return (
    <ScreenBoundary name="ProductCards">
      <ProductCardsScreen {...props} />
    </ScreenBoundary>
  );
}
