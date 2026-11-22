// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Order, OrdersPage } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const orders: Order[] = [
  {
    id: "2841",
    number: "#A-2841",
    customer: "Saoirse Walsh",
    itemCount: 3,
    total: 184.5,
    currency: "USD",
    stage: "delivered",
    carrier: "DHL",
    eta: "2026-04-22",
    placedAt: "2026-04-18T09:12:00Z",
  },
  {
    id: "2840",
    number: "#A-2840",
    customer: "Marcus Rivera",
    itemCount: 1,
    total: 32,
    currency: "USD",
    stage: "shipped",
    carrier: "UPS",
    eta: "2026-04-27",
    placedAt: "2026-04-17T15:40:00Z",
  },
  {
    id: "2839",
    number: "#A-2839",
    customer: "Lin Wei",
    itemCount: 5,
    total: 412.9,
    currency: "USD",
    stage: "shipped",
    carrier: "FedEx",
    eta: "2026-04-28",
    placedAt: "2026-04-17T11:05:00Z",
  },
  {
    id: "2838",
    number: "#A-2838",
    customer: "Pavel Doronin",
    itemCount: 2,
    total: 96,
    currency: "USD",
    stage: "packed",
    carrier: "USPS",
    eta: "2026-04-29",
    placedAt: "2026-04-16T19:22:00Z",
  },
  {
    id: "2837",
    number: "#A-2837",
    customer: "Aiyana Curtis",
    itemCount: 1,
    total: 19.5,
    currency: "USD",
    stage: "ordered",
    carrier: null,
    eta: "2026-04-30",
    placedAt: "2026-04-16T08:47:00Z",
  },
  {
    id: "2836",
    number: "#A-2836",
    customer: "Daichi Watanabe",
    itemCount: 4,
    total: 240,
    currency: "USD",
    stage: "delivered",
    carrier: "DHL",
    eta: "2026-04-21",
    placedAt: "2026-04-15T13:30:00Z",
  },
];

/** What the mocks return for `listOrders`. */
export const listOrders: OrdersPage = { items: orders, total: 248 };

/** What the mocks return for `printLabels`. */
export const printLabels = { url: "https://example.com/labels/batch-1.pdf" };
