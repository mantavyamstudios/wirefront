// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const EndpointStatus = z.enum(["success", "failing", "paused"]).meta({ id: "EndpointStatus" });
export type EndpointStatus = z.infer<typeof EndpointStatus>;

export const WebhookEndpoint = z
  .object({ id: z.string(), url: z.string(), events: z.array(z.string()), status: EndpointStatus, lastDeliveryAt: z.iso.datetime({ offset: true }).nullable() })
  .meta({ id: "WebhookEndpoint" });
export type WebhookEndpoint = z.infer<typeof WebhookEndpoint>;

export const WebhookDelivery = z
  .object({
    id: z.string(),
    at: z.iso.datetime({ offset: true }),
    event: z.string(),
    /** Where it was sent, shortened for display, e.g. "api.acme.com/hooks". */
    endpoint: z.string(),
    /** HTTP status the endpoint answered with. */
    status: z.number().int(),
    durationMs: z.number().nonnegative(),
    attempt: z.number().int().min(1),
    maxAttempts: z.number().int().min(1),
    /** Request and response bodies, as sent and received. */
    request: z.string(),
    response: z.string(),
  })
  .meta({ id: "WebhookDelivery" });
export type WebhookDelivery = z.infer<typeof WebhookDelivery>;

export const WebhookOverview = z
  .object({
    /** The last characters of the signing secret, for the masked display. */
    secretHint: z.string(),
    endpoints: z.array(WebhookEndpoint),
    /** Newest first. */
    deliveries: z.array(WebhookDelivery),
  })
  .meta({ id: "WebhookOverview" });
export type WebhookOverview = z.infer<typeof WebhookOverview>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getWebhooks: { method: "GET", path: "/webhooks", summary: "Endpoints, recent deliveries and the signing secret hint", response: WebhookOverview },
  revealSecret: { method: "GET", path: "/webhooks/secret", summary: "The full signing secret (ask for re-authentication first if you need to)", response: z.object({ secret: z.string() }) },
  rotateSecret: { method: "POST", path: "/webhooks/secret/rotate", summary: "Issue a new signing secret; the old one stays valid for 24 hours", response: z.object({ secret: z.string() }) },
  setEndpointPaused: { method: "PATCH", path: "/webhooks/endpoints/{id}", summary: "Pause or resume an endpoint", params: z.object({ id: z.string() }), body: z.object({ paused: z.boolean() }) },
  deleteEndpoint: { method: "DELETE", path: "/webhooks/endpoints/{id}", summary: "Delete an endpoint", params: z.object({ id: z.string() }) },
  resendDelivery: { method: "POST", path: "/webhooks/deliveries/{id}/resend", summary: "Send a delivery again", params: z.object({ id: z.string() }) },
});
