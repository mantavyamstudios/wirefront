// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

const Money = z.object({ amount: z.number(), currency: z.string().length(3) });

export const BillingInvoice = z
  .object({
    id: z.string(),
    number: z.string(),
    issuedAt: z.iso.date(),
    total: Money,
    status: z.enum(["paid", "open", "void"]),
    /** The hosted invoice page (e.g. Stripe's), opened in a new tab. */
    url: z.url().optional(),
  })
  .meta({ id: "BillingInvoice" });
export type BillingInvoice = z.infer<typeof BillingInvoice>;

export const Billing = z
  .object({
    plan: z.object({
      name: z.string(),
      interval: z.enum(["month", "year"]),
      /** One line about what the plan includes, e.g. "25 seats · unlimited projects". */
      summary: z.string(),
      status: z.enum(["active", "trialing", "past_due", "canceled"]),
      /** When it renews, the trial ends, or a canceled plan stops. */
      periodEnd: z.iso.date(),
    }),
    monthlyPrice: Money,
    paymentMethod: z
      .object({ brand: z.string(), last4: z.string().length(4), expMonth: z.int().min(1).max(12), expYear: z.int(), email: z.email().optional() })
      .nullable(),
    credits: Money,
    taxId: z.object({ type: z.string(), value: z.string() }).nullable(),
    invoices: z.array(BillingInvoice),
  })
  .meta({ id: "Billing" });
export type Billing = z.infer<typeof Billing>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getBilling: { method: "GET", path: "/billing", summary: "Plan, payment method, credits and recent invoices", response: Billing },
  cancelPlan: { method: "POST", path: "/billing/cancel", summary: "Cancel at the end of the current period" },
  exportInvoices: { method: "POST", path: "/billing/invoices/export", summary: "Email a zip of every invoice to the billing contact" },
});
