// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const DeliveryItem = z.object({ id: z.string(), name: z.string(), detail: z.string(), /** Unit price. */ price: z.number(), qty: z.number().int().min(1), art: z.enum(["bread", "milk", "fruit", "flowers"]) }).meta({ id: "DeliveryItem" });
export type DeliveryItem = z.infer<typeof DeliveryItem>;

export const DeliveryCourier = z.object({ name: z.string(), rating: z.number(), trips: z.number().int(), vehicle: z.string(), /** E.164, used for the call button. */ phone: z.string() }).meta({ id: "DeliveryCourier" });
export type DeliveryCourier = z.infer<typeof DeliveryCourier>;

export const DeliveryStatus = z.enum(["confirmed", "packed", "on_the_way", "delivered"]);
export type DeliveryStatus = z.infer<typeof DeliveryStatus>;

export const DeliveryTracking = z
  .object({
    status: DeliveryStatus,
    /** How far along the route the courier is, 0 to 1. Drives the illustrated map. */
    progress: z.number().min(0).max(1),
    etaMinutes: z.number().int(),
    /** ISO timestamp of the expected (or actual) arrival. */
    arrivesAt: z.string(),
    /** Where the courier is, in words, e.g. "Tomás is crossing Calder Bridge". */
    location: z.string().optional(),
  })
  .meta({ id: "DeliveryTracking" });
export type DeliveryTracking = z.infer<typeof DeliveryTracking>;

export const DeliveryMessage = z.object({ id: z.string(), from: z.enum(["me", "courier"]), text: z.string(), /** ISO timestamp. */ sentAt: z.string() }).meta({ id: "DeliveryMessage" });
export type DeliveryMessage = z.infer<typeof DeliveryMessage>;

export const DeliveryOrder = z
  .object({ id: z.string(), storeName: z.string(), address: z.string(), note: z.string(), courier: DeliveryCourier, items: z.array(DeliveryItem), deliveryFee: z.number() })
  .meta({ id: "DeliveryOrder" });
export type DeliveryOrder = z.infer<typeof DeliveryOrder>;

/** The backend operations this screen calls. Tracking and new messages usually arrive over a live connection. */
export const api = defineApi({
  getDeliveryOrder: { method: "GET", path: "/deliveries/{id}", summary: "The order, courier and drop-off note", params: z.object({ id: z.string() }), response: DeliveryOrder },
  getTracking: { method: "GET", path: "/deliveries/{id}/tracking", summary: "Where the courier is now", params: z.object({ id: z.string() }), response: DeliveryTracking },
  listCourierMessages: { method: "GET", path: "/deliveries/{id}/messages", summary: "Chat with the courier", params: z.object({ id: z.string() }), response: z.array(DeliveryMessage) },
  sendCourierMessage: { method: "POST", path: "/deliveries/{id}/messages", summary: "Message the courier", params: z.object({ id: z.string() }), body: z.object({ text: z.string().min(1) }), response: DeliveryMessage },
  updateDropOffNote: { method: "PUT", path: "/deliveries/{id}/note", summary: "Change the note for the courier", params: z.object({ id: z.string() }), body: z.object({ note: z.string().max(140) }) },
  rateCourier: { method: "POST", path: "/deliveries/{id}/rating", summary: "Rate the courier", params: z.object({ id: z.string() }), body: z.object({ rating: z.number().int().min(1).max(5) }) },
  tipCourier: { method: "POST", path: "/deliveries/{id}/tip", summary: "Set or clear the tip", params: z.object({ id: z.string() }), body: z.object({ amount: z.number().nullable() }) },
});
