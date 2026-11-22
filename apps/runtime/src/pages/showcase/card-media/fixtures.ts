// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ArticleTeaser } from "./schema";

/** What the mocks return for `listLatestArticles`. Demo data for the showcase and tests. */
export const listLatestArticles: ArticleTeaser[] = [
  {
    id: "particle-fields",
    category: "Engineering",
    title: "Building responsive particle fields with WebGL",
    excerpt:
      "How we render 40k animated dots at 120fps without dropping frames on low-end devices.",
    author: { name: "Lina Rodrigues" },
    readMinutes: 8,
    href: "#particle-fields",
    saved: false,
  },
  {
    id: "type-system",
    category: "Design",
    title: "Anatomy of a type system you can ship",
    excerpt:
      "Three rules we follow when designing modular scales and weight ramps for product UI.",
    author: { name: "Priya Joshi" },
    readMinutes: 5,
    href: "#type-system",
    saved: true,
  },
  {
    id: "metrics",
    category: "Product",
    title: "Metrics that don’t lie: a guide to honest dashboards",
    excerpt:
      "Why we ditched “engagement” and started measuring time-to-first-value instead.",
    author: { name: "Marc Klein" },
    readMinutes: 12,
    href: "#metrics",
    saved: false,
  },
];
