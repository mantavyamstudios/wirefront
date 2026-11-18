// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { DeliveryMessage, DeliveryOrder, DeliveryTracking } from "./schema";

/** The demo clock. */
export const now = "2026-10-24T19:24:00Z";

/** Demo data for the showcase, the generated mocks and tests. */
export const getDeliveryOrder: DeliveryOrder = {
  id: "LC-20931",
  storeName: "Larder & Co.",
  address: "Flat 3, 18 Alder Row",
  note: "Leave with the concierge if I’m not in.",
  courier: { name: "Tomás Reyes", rating: 4.9, trips: 1284, vehicle: "Green e-bike", phone: "+15555550142" },
  deliveryFee: 2.99,
  items: [
    { id: "d1", name: "Country sourdough", detail: "800 g, sliced", price: 7.5, qty: 1, art: "bread" },
    { id: "d2", name: "Barista oat milk", detail: "1 L", price: 3.2, qty: 2, art: "milk" },
    { id: "d3", name: "Clementines", detail: "1 kg net", price: 4.8, qty: 1, art: "fruit" },
    { id: "d4", name: "Seasonal stems", detail: "Small bunch", price: 12, qty: 1, art: "flowers" },
  ],
};

/** The whole trip takes this long; the demo starts 30% of the way in. */
export const routeMinutes = 18;
export const startAt = 0.3;

export const getTracking: DeliveryTracking = { status: "on_the_way", progress: startAt, etaMinutes: 13, arrivesAt: "2026-10-24T19:37:00Z", location: "Tomás is heading up Linden Avenue" };

/** What the courier is doing at each point of the route, for the demo's live updates. */
export const locations = [
  { from: 1, text: "Tomás is at your door" },
  { from: 0.93, text: "Tomás is pulling up outside" },
  { from: 0.8, text: "Tomás is turning onto Alder Row" },
  { from: 0.62, text: "Tomás is crossing Calder Bridge" },
  { from: 0.45, text: "Tomás is riding along Quay Road" },
  { from: 0.27, text: "Tomás is heading up Linden Avenue" },
  { from: 0, text: "Tomás is leaving Harbor Street" },
];

export const listCourierMessages: DeliveryMessage[] = [{ id: "m1", from: "courier", text: "Hi! Picked up your order from Larder & Co. and I’m on my way.", sentAt: "2026-10-24T19:20:00Z" }];
export const quickReplies = ["Leave it at the door", "Please ring the bell", "I’m coming down"];
export const tipOptions = [2, 3, 5];
export const sendCourierMessage: DeliveryMessage = { id: "m2", from: "me", text: "Please ring the bell", sentAt: now };
