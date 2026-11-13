// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ScopeResource = z.object({ id: z.string(), name: z.string(), readOnly: z.boolean().optional() }).meta({ id: "ScopeResource" });
export type ScopeResource = z.infer<typeof ScopeResource>;

/** A key as listed: never its secret. */
export const DevApiKey = z
  .object({
    id: z.string(),
    name: z.string(),
    /** e.g. "dvl_live_". */
    prefix: z.string(),
    last4: z.string().length(4),
    /** "read:projects", "write:deployments", … */
    scopes: z.array(z.string()),
    expiresAt: z.iso.datetime().nullable(),
    lastUsedAt: z.iso.datetime().nullable(),
  })
  .meta({ id: "DevApiKey" });
export type DevApiKey = z.infer<typeof DevApiKey>;

export const EventGroup = z
  .object({ id: z.string(), name: z.string(), events: z.array(z.object({ id: z.string(), hint: z.string() })) })
  .meta({ id: "EventGroup" });
export type EventGroup = z.infer<typeof EventGroup>;

export const Delivery = z
  .object({
    id: z.string(),
    event: z.string(),
    /** HTTP status, or "timeout". */
    status: z.union([z.int(), z.literal("timeout")]),
    latencyMs: z.int().min(0),
    at: z.iso.datetime(),
  })
  .meta({ id: "Delivery" });
export type Delivery = z.infer<typeof Delivery>;

/** An endpoint as listed: its signing secret is fetched only when revealed. */
export const Endpoint = z
  .object({ id: z.string(), url: z.url(), paused: z.boolean(), events: z.array(z.string()), deliveries: z.array(Delivery) })
  .meta({ id: "Endpoint" });
export type Endpoint = z.infer<typeof Endpoint>;

export const DeveloperData = z
  .object({
    resources: z.array(ScopeResource),
    keys: z.array(DevApiKey),
    eventGroups: z.array(EventGroup),
    endpoints: z.array(Endpoint),
  })
  .meta({ id: "DeveloperData" });
export type DeveloperData = z.infer<typeof DeveloperData>;

export const CreateKeyInput = z
  .object({
    name: z.string().trim().min(1, "Name the key after what uses it.").max(60),
    scopes: z.array(z.string()).min(1, "Pick at least one scope."),
    /** 0 for no expiry. */
    expiresInDays: z.union([z.literal(7), z.literal(30), z.literal(90), z.literal(365), z.literal(0)]),
  })
  .meta({ id: "CreateKeyInput" });
export type CreateKeyInput = z.infer<typeof CreateKeyInput>;

/** A new or rolled key with its secret: the only time the secret leaves the server. */
export const KeyWithSecret = z.object({ key: DevApiKey, secret: z.string() }).meta({ id: "KeyWithSecret" });
export type KeyWithSecret = z.infer<typeof KeyWithSecret>;

export const EndpointInput = z
  .object({ url: z.url({ protocol: /^https$/, error: "Use a full https:// address." }), events: z.array(z.string()).min(1) })
  .meta({ id: "EndpointInput" });
export type EndpointInput = z.infer<typeof EndpointInput>;

export const SigningSecret = z.object({ secret: z.string() }).meta({ id: "SigningSecret" });

const IdParams = z.object({ id: z.string() });

/** The backend operations this screen calls. */
export const api = defineApi({
  getDeveloper: { method: "GET", path: "/developer", summary: "API keys, webhook endpoints and recent deliveries", response: DeveloperData },
  createKey: { method: "POST", path: "/developer/keys", summary: "Create a key; the response holds its secret once", body: CreateKeyInput, response: KeyWithSecret },
  rollKey: { method: "POST", path: "/developer/keys/{id}/roll", summary: "Replace a key's secret", params: IdParams, response: KeyWithSecret },
  revokeKey: { method: "DELETE", path: "/developer/keys/{id}", summary: "Revoke a key", params: IdParams },
  createEndpoint: { method: "POST", path: "/developer/endpoints", summary: "Add a webhook endpoint", body: EndpointInput, response: Endpoint },
  updateEndpoint: {
    method: "PATCH",
    path: "/developer/endpoints/{id}",
    summary: "Change an endpoint's events or pause it",
    params: IdParams,
    body: z.object({ events: z.array(z.string()).optional(), paused: z.boolean().optional() }),
  },
  deleteEndpoint: { method: "DELETE", path: "/developer/endpoints/{id}", summary: "Delete an endpoint and its delivery history", params: IdParams },
  getSigningSecret: { method: "GET", path: "/developer/endpoints/{id}/secret", summary: "The endpoint's signing secret", params: IdParams, response: SigningSecret },
  rollSigningSecret: {
    method: "POST",
    path: "/developer/endpoints/{id}/secret",
    summary: "Replace the signing secret; the old one keeps working for 24 hours",
    params: IdParams,
    response: SigningSecret,
  },
  sendTest: { method: "POST", path: "/developer/endpoints/{id}/test", summary: "Send a ping event and report the delivery", params: IdParams, response: Delivery },
  retryDeliveries: {
    method: "POST",
    path: "/developer/endpoints/{id}/retry",
    summary: "Redeliver failed events and report the results",
    params: IdParams,
    body: z.object({ deliveryIds: z.array(z.string()).min(1) }),
    response: z.array(Delivery),
  },
});
