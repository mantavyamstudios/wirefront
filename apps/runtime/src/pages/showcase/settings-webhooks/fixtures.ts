// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { WebhookDelivery, WebhookOverview } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-26T12:50:00Z";
const ago = (minutes: number) =>
  new Date(Date.parse(now) - minutes * 60_000).toISOString();

const rawDeliveries = [
  {
    id: "evt_01HRX2",
    ts: "12:48:21",
    event: "billing.updated",
    endpointShort: "api.acme.com/hooks/app",
    status: 200,
    ms: 124,
    request:
      '{\n  "id": "evt_01HRX2",\n  "type": "billing.updated",\n  "created": 1745671701,\n  "data": {\n    "object": {\n      "id": "sub_4F2k",\n      "customer": "cus_acme",\n      "plan": "team_annual",\n      "status": "active",\n      "amount": 29000\n    }\n  }\n}',
    response:
      '{\n  "received": true,\n  "queued_for": "ops-pipeline",\n  "trace_id": "tr_a91f3c8b6e5d04a1"\n}',
  },
  {
    id: "evt_01HRX1",
    ts: "12:46:02",
    event: "user.created",
    endpointShort: "relay.zapier.com/.../abcd",
    status: 200,
    ms: 311,
    request: "",
    response: "",
  },
  {
    id: "evt_01HRX0",
    ts: "12:42:18",
    event: "billing.updated",
    endpointShort: "hooks.flux.dev/v2/app",
    status: 502,
    ms: 5021,
    retried: true,
    request: "",
    response: "",
  },
  {
    id: "evt_01HRWZ",
    ts: "12:39:44",
    event: "team.invited",
    endpointShort: "api.acme.com/hooks/app",
    status: 200,
    ms: 88,
    request: "",
    response: "",
  },
  {
    id: "evt_01HRWY",
    ts: "12:31:09",
    event: "user.updated",
    endpointShort: "relay.zapier.com/.../abcd",
    status: 429,
    ms: 22,
    retried: true,
    request: "",
    response: "",
  },
  {
    id: "evt_01HRWX",
    ts: "12:18:51",
    event: "audit.log",
    endpointShort: "ops.acme.com/internal/audit",
    status: 204,
    ms: 47,
    request: "",
    response: "",
  },
];

/** The raw demo log, mapped onto the delivery contract below. */
type Raw = {
  id: string;
  ts: string;
  event: string;
  endpointShort: string;
  status: number;
  ms: number;
  retried?: boolean;
  request: string;
  response: string;
};

export const deliveries: WebhookDelivery[] = (rawDeliveries as Raw[]).map(
  (d) => ({
    id: d.id,
    at: `2026-04-26T${d.ts}Z`,
    event: d.event,
    endpoint: d.endpointShort,
    status: d.status,
    durationMs: d.ms,
    attempt: d.retried ? 2 : 1,
    maxAttempts: d.retried ? 3 : 1,
    request: d.request || `{\n  "id": "${d.id}",\n  "type": "${d.event}"\n}`,
    response:
      d.response ||
      (d.status >= 500
        ? '{\n  "error": "upstream timeout",\n  "retry_after": 30\n}'
        : d.status === 429
          ? '{\n  "error": "rate_limited",\n  "retry_after": 12\n}'
          : '{\n  "received": true\n}'),
  })
);

export const getWebhooks: WebhookOverview = {
  secretHint: "2f3a",
  endpoints: [
    {
      id: "we_8f4ad",
      url: "https://api.acme.com/hooks/app",
      events: [
        "user.created",
        "user.updated",
        "billing.updated",
        "team.invited",
        "team.removed",
      ],
      status: "success",
      lastDeliveryAt: ago(2),
    },
    {
      id: "we_220bc",
      url: "https://hooks.flux.dev/v2/app/incoming",
      events: ["billing.updated", "billing.refunded"],
      status: "failing",
      lastDeliveryAt: ago(11),
    },
    {
      id: "we_e1d12",
      url: "https://ops.acme.com/internal/audit",
      events: ["audit.log", "user.created", "user.deleted", "team.invited"],
      status: "success",
      lastDeliveryAt: ago(180),
    },
    {
      id: "we_aabc8",
      url: "https://stage.acme.com/integrations/app/webhook-receiver",
      events: ["user.created", "billing.updated"],
      status: "paused",
      lastDeliveryAt: null,
    },
    {
      id: "we_44910",
      url: "https://relay.zapier.com/hooks/catch/8829194/abcd",
      events: [
        "user.created",
        "user.updated",
        "billing.updated",
        "team.invited",
      ],
      status: "success",
      lastDeliveryAt: ago(27),
    },
  ],
  deliveries,
};

export const revealSecret = { secret: "whsec_8a2f0bd1e44c5a9772f3a" };
export const rotateSecret = { secret: "whsec_51c9e07ab2d34f8e9910b" };
