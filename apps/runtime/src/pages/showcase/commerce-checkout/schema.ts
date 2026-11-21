// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const CheckoutArt = z.enum(["mug", "tote", "candle", "notebook"]);
export type CheckoutArt = z.infer<typeof CheckoutArt>;

export const CheckoutItem = z.object({ id: z.string(), name: z.string(), variant: z.string(), /** Unit price. */ price: z.number(), qty: z.number().int().min(1), art: CheckoutArt }).meta({ id: "CheckoutItem" });
export type CheckoutItem = z.infer<typeof CheckoutItem>;

export const CheckoutShipping = z.object({ id: z.string(), label: z.string(), /** Shown as written, e.g. "Tue 27 Oct". */ eta: z.string(), price: z.number(), icon: z.enum(["standard", "express", "next"]) }).meta({ id: "CheckoutShipping" });
export type CheckoutShipping = z.infer<typeof CheckoutShipping>;

export const CheckoutCountry = z
  .object({
    code: z.string(),
    name: z.string(),
    /** States or provinces to pick from, if the country uses them. */
    regions: z.array(z.string()).optional(),
    regionLabel: z.string().optional(),
    /** Regular expression source the postal code must match. */
    postPattern: z.string(),
    postLabel: z.string(),
    postHint: z.string(),
  })
  .meta({ id: "CheckoutCountry" });
export type CheckoutCountry = z.infer<typeof CheckoutCountry>;

export const CheckoutAddress = z.object({ first: z.string(), last: z.string(), line1: z.string(), line2: z.string(), city: z.string(), country: z.string(), region: z.string(), postcode: z.string() }).meta({ id: "CheckoutAddress" });
export type CheckoutAddress = z.infer<typeof CheckoutAddress>;

export const CheckoutCard = z.object({ number: z.string(), expiry: z.string(), cvc: z.string(), holder: z.string() }).meta({ id: "CheckoutCard" });
export type CheckoutCard = z.infer<typeof CheckoutCard>;

export const PlaceOrder = z
  .object({
    email: z.string().email(),
    newsletter: z.boolean(),
    address: CheckoutAddress,
    shippingId: z.string(),
    promoCode: z.string().optional(),
    sameBilling: z.boolean(),
    /** Only sent when the built-in card fields are used; with a payment slot your provider handles the card. */
    card: CheckoutCard.optional(),
  })
  .meta({ id: "PlaceOrder" });
export type PlaceOrder = z.infer<typeof PlaceOrder>;

export const Promo = z.object({ code: z.string(), /** 0.1 for 10% off. */ percentOff: z.number() }).meta({ id: "Promo" });
export type Promo = z.infer<typeof Promo>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getCart: { method: "GET", path: "/cart", summary: "Items in the cart", response: z.array(CheckoutItem) },
  listShippingOptions: { method: "GET", path: "/checkout/shipping", summary: "Delivery speeds and prices", response: z.array(CheckoutShipping) },
  updateCartItem: { method: "PATCH", path: "/cart/items/{id}", summary: "Change an item's quantity", params: z.object({ id: z.string() }), body: z.object({ qty: z.number().int().min(1) }) },
  applyPromo: { method: "POST", path: "/checkout/promo", summary: "Check a discount code", body: z.object({ code: z.string() }), response: Promo },
  placeOrder: { method: "POST", path: "/orders", summary: "Place the order and take payment", body: PlaceOrder, response: z.object({ orderNo: z.string() }) },
});
