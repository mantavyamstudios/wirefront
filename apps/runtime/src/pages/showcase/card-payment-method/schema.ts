// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const CardBrand = z
  .enum(["visa", "mastercard", "amex", "discover", "other"])
  .meta({ id: "CardBrand" });
export type CardBrand = z.infer<typeof CardBrand>;

/** A saved card, as your payment processor describes it. Never the full number. */
export const SavedCard = z
  .object({
    id: z.string(),
    brand: CardBrand,
    last4: z.string().length(4),
    expMonth: z.int().min(1).max(12),
    expYear: z.int().min(2000),
    holder: z.string(),
    primary: z.boolean(),
  })
  .meta({ id: "SavedCard" });
export type SavedCard = z.infer<typeof SavedCard>;

/** The backend operations this screen calls. Adding a card happens in your processor's own form. */
export const api = defineApi({
  listCards: {
    method: "GET",
    path: "/billing/cards",
    summary: "Saved cards",
    response: z.array(SavedCard),
  },
  makePrimary: {
    method: "POST",
    path: "/billing/cards/{id}/primary",
    summary: "Use this card for future charges",
    params: z.object({ id: z.string() }),
  },
});
