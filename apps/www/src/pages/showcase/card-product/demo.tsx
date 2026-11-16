// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the cards with sample products. Not shipped by the registry.
import * as fixtures from "./fixtures";
import { ProductCards } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function CardProductShowcasePage() {
  return <ProductCards collection="spring drop" onAddToBag={() => wait(600)} onWishlist={() => wait(400)} products={fixtures.products} total={fixtures.listCollection.total} />;
}
