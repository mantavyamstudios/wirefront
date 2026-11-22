// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the cards with sample articles. Not shipped by the registry.
import * as fixtures from "./fixtures";
import { ArticleCards } from "./view";

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function CardMediaShowcasePage() {
  return (
    <ArticleCards
      articles={fixtures.listLatestArticles}
      onSave={() => wait(400)}
    />
  );
}
