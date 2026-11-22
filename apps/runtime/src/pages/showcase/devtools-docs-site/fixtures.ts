// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { DocsPage } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const pages: DocsPage[] = [
  {
    id: "introduction",
    title: "Introduction",
    group: "Getting started",
    lead: "Kestrel delivers events from your product to your customers' endpoints, with retries, signatures and a delivery log they can trust.",
    updatedAt: "2026-10-02",
    minutes: 2,
    sections: [
      {
        id: "what-you-can-build",
        title: "What you can build",
        blocks: [
          {
            type: "p",
            text: "Anything your customers would otherwise poll for. Teams use Kestrel to send order updates to warehouses, sync CRM records, trigger builds and page on-call when a job fails.",
          },
          {
            type: "list",
            items: [
              "Outgoing webhooks with per-customer endpoints",
              "A hosted portal where customers manage their own endpoints",
              "Delivery logs, replays and alerts without building them yourself",
            ],
          },
        ],
      },
      {
        id: "how-it-fits",
        title: "How it fits together",
        blocks: [
          {
            type: "p",
            text: "Your backend publishes an event once. Kestrel fans it out to every subscribed endpoint, signs each request, retries failures and records every attempt.",
          },
        ],
      },
    ],
  },
  {
    id: "quickstart",
    title: "Quickstart",
    group: "Getting started",
    lead: "Send your first webhook in about five minutes.",
    updatedAt: "2026-10-18",
    minutes: 5,
    sections: [
      {
        id: "install",
        title: "Install the SDK",
        blocks: [
          {
            type: "code",
            samples: {
              node: "npm install @kestrel/node",
              python: "pip install kestrel",
              go: "go get kestrel.dev/go/v2",
              curl: "# No install needed. Every SDK call maps to one HTTP request.",
            },
          },
        ],
      },
      {
        id: "send-event",
        title: "Send an event",
        blocks: [
          {
            type: "p",
            text: "Publish an event with a type and a JSON payload. Every endpoint subscribed to that type receives it.",
          },
          {
            type: "code",
            samples: {
              node: `const kestrel = new Kestrel(process.env.KESTREL_KEY);\n\nawait kestrel.events.publish({\n  type: "order.shipped",\n  data: { orderId: "ord_9QX2", carrier: "Parcelwise" },\n});`,
              python: `kestrel = Kestrel(os.environ["KESTREL_KEY"])\n\nkestrel.events.publish(\n    type="order.shipped",\n    data={"order_id": "ord_9QX2", "carrier": "Parcelwise"},\n)`,
              go: `client := kestrel.New(os.Getenv("KESTREL_KEY"))\n\nclient.Events.Publish(ctx, kestrel.Event{\n\tType: "order.shipped",\n\tData: map[string]any{"orderId": "ord_9QX2"},\n})`,
              curl: `curl https://api.kestrel.dev/v2/events \\\n  -H "Authorization: Bearer $KESTREL_KEY" \\\n  -d type=order.shipped \\\n  -d data[orderId]=ord_9QX2`,
            },
          },
          {
            type: "callout",
            tone: "info",
            title: "Use a test key first",
            text: "Keys starting with `kst_test_` deliver to test endpoints only, so you can try this without touching customer traffic.",
          },
        ],
      },
    ],
  },
  {
    id: "authentication",
    title: "Authentication",
    group: "Getting started",
    lead: "Every API request is authenticated with a secret key from your dashboard.",
    updatedAt: "2026-09-12",
    minutes: 2,
    sections: [
      {
        id: "api-keys",
        title: "API keys",
        blocks: [
          {
            type: "table",
            head: ["Prefix", "Environment", "Can deliver to"],
            rows: [
              ["kst_live_", "Production", "Live endpoints"],
              ["kst_test_", "Test", "Test endpoints and the local CLI"],
            ],
          },
          {
            type: "callout",
            tone: "warning",
            title: "Keep secret keys on the server",
            text: "Anyone with a secret key can publish events as you. Never ship one in a browser bundle or a mobile app.",
          },
        ],
      },
    ],
  },
  {
    id: "signatures",
    title: "Verifying signatures",
    group: "Webhooks",
    lead: "Kestrel signs every request so your customers can check it came from you and wasn't changed on the way.",
    updatedAt: "2026-10-09",
    minutes: 3,
    sections: [
      {
        id: "how-signing-works",
        title: "How signing works",
        blocks: [
          {
            type: "p",
            text: "Each request carries a `Kestrel-Signature` header: a timestamp and an HMAC-SHA256 of the timestamp and raw body, keyed with the endpoint's signing secret.",
          },
        ],
      },
      {
        id: "verify",
        title: "Verify in your handler",
        blocks: [
          {
            type: "code",
            samples: {
              node: `const event = kestrel.webhooks.verify(\n  rawBody,\n  req.headers["kestrel-signature"],\n  process.env.ENDPOINT_SECRET,\n);`,
              python: `event = kestrel.webhooks.verify(\n    raw_body,\n    request.headers["Kestrel-Signature"],\n    os.environ["ENDPOINT_SECRET"],\n)`,
              go: `event, err := kestrel.Verify(body, r.Header.Get("Kestrel-Signature"), secret)`,
            },
          },
        ],
      },
    ],
  },
  {
    id: "retries",
    badge: "New",
    title: "Retries and dead letters",
    group: "Webhooks",
    lead: "When an endpoint fails, Kestrel retries with backoff, then parks the event in a dead-letter queue, so nothing is lost and one bad endpoint never holds up the rest.",
    updatedAt: "2026-10-22",
    minutes: 4,
    sections: [
      {
        id: "how-retries-work",
        title: "How retries work",
        blocks: [
          {
            type: "callout",
            tone: "info",
            title: "Changed in v2.4",
            text: "Events now move to the dead-letter queue after three failed attempts. Before v2.4 they were retried for up to 24 hours.",
          },
          {
            type: "p",
            text: "A delivery fails when the endpoint answers with anything other than a `2xx`, takes longer than 15 seconds, or can't be reached. Each retry waits longer than the last, with jitter so a recovering endpoint isn't hit by every event at once.",
          },
          {
            type: "table",
            head: ["Attempt", "Sent after", "If it fails"],
            rows: [
              ["1", "Immediately", "Retry in about 1 minute"],
              ["2", "~1 minute", "Retry in about 10 minutes"],
              ["3", "~10 minutes", "Move to the dead-letter queue"],
            ],
          },
          {
            type: "p",
            text: "An endpoint that answers `410 Gone` is disabled straight away and its pending events are dead-lettered.",
          },
        ],
      },
      {
        id: "dead-letter-queue",
        title: "The dead-letter queue",
        blocks: [
          {
            type: "p",
            text: "Dead-lettered events keep their payload, every attempt and the last error for 7 days. List them per endpoint to see what went wrong.",
          },
          {
            type: "code",
            title: "List dead letters for an endpoint",
            samples: {
              node: `const parked = await kestrel.deadLetters.list({\n  endpointId: "ep_8fK21",\n  limit: 20,\n});\n\nfor (const letter of parked.data) {\n  console.log(letter.eventId, letter.lastError);\n}`,
              python: `parked = kestrel.dead_letters.list(endpoint_id="ep_8fK21", limit=20)\n\nfor letter in parked.data:\n    print(letter.event_id, letter.last_error)`,
              go: `parked, err := client.DeadLetters.List(ctx, &kestrel.DeadLetterParams{\n\tEndpointID: "ep_8fK21",\n\tLimit:      20,\n})`,
              curl: `curl "https://api.kestrel.dev/v2/dead_letters?endpoint_id=ep_8fK21&limit=20" \\\n  -H "Authorization: Bearer $KESTREL_KEY"`,
            },
          },
        ],
      },
      {
        id: "replaying",
        title: "Replaying events",
        blocks: [
          {
            type: "steps",
            items: [
              "Fix the endpoint, or wait until your customer confirms it's back.",
              "Open Deliveries, filter by Dead-lettered, and select the events to send again.",
              "Choose Replay. Each event is delivered once more and counted as a new attempt.",
            ],
          },
          {
            type: "code",
            title: "Replay from code",
            samples: {
              node: `await kestrel.deadLetters.replay("dl_3Hc9Ve");`,
              python: `kestrel.dead_letters.replay("dl_3Hc9Ve")`,
              go: `err := client.DeadLetters.Replay(ctx, "dl_3Hc9Ve")`,
              curl: `curl -X POST https://api.kestrel.dev/v2/dead_letters/dl_3Hc9Ve/replay \\\n  -H "Authorization: Bearer $KESTREL_KEY"`,
            },
          },
          {
            type: "callout",
            tone: "warning",
            title: "Replays can arrive out of order",
            text: "A replayed event may land after newer events for the same object. Compare the event's created timestamp before overwriting state.",
          },
        ],
      },
      {
        id: "limits",
        title: "Limits",
        blocks: [
          {
            type: "table",
            head: ["Limit", "Value"],
            rows: [
              ["Attempts per event", "3"],
              ["Request timeout", "15 seconds"],
              ["Dead-letter retention", "7 days"],
              ["Replay rate", "50 events/s per endpoint"],
            ],
          },
        ],
      },
    ],
  },
  {
    id: "replay-guide",
    title: "Bulk replays",
    group: "Webhooks",
    lead: "Send a whole window of events again after an outage, without flooding the endpoint.",
    updatedAt: "2026-10-22",
    minutes: 3,
    sections: [
      {
        id: "choose-window",
        title: "Choose a window",
        blocks: [
          {
            type: "p",
            text: "Pick a start and end time and an optional event type. Kestrel shows how many events match before anything is sent.",
          },
          {
            type: "code",
            samples: {
              node: `await kestrel.replays.create({\n  endpointId: "ep_8fK21",\n  from: "2026-10-21T09:00:00Z",\n  to: "2026-10-21T09:40:00Z",\n});`,
              curl: `curl https://api.kestrel.dev/v2/replays \\\n  -H "Authorization: Bearer $KESTREL_KEY" \\\n  -d endpoint_id=ep_8fK21 \\\n  -d from=2026-10-21T09:00:00Z \\\n  -d to=2026-10-21T09:40:00Z`,
            },
          },
        ],
      },
      {
        id: "pacing",
        title: "Pacing",
        blocks: [
          {
            type: "p",
            text: "Bulk replays are paced at the endpoint's replay rate and pause automatically if the endpoint starts failing again.",
          },
        ],
      },
    ],
  },
  {
    id: "events-api",
    title: "Events",
    group: "API reference",
    lead: "The Event object, and how to list and retrieve events.",
    updatedAt: "2026-10-14",
    minutes: 3,
    sections: [
      {
        id: "event-object",
        title: "The Event object",
        blocks: [
          {
            type: "table",
            head: ["Field", "Type", "Description"],
            rows: [
              ["id", "string", "Unique ID, prefixed evt_"],
              ["type", "string", "Dot-separated name, e.g. order.shipped"],
              ["data", "object", "Your payload, up to 256 KB"],
              ["created", "timestamp", "When you published it"],
            ],
          },
        ],
      },
      {
        id: "list-events",
        title: "List events",
        blocks: [
          {
            type: "code",
            samples: {
              node: `const events = await kestrel.events.list({ type: "order.shipped" });`,
              python: `events = kestrel.events.list(type="order.shipped")`,
              curl: `curl "https://api.kestrel.dev/v2/events?type=order.shipped" \\\n  -H "Authorization: Bearer $KESTREL_KEY"`,
            },
          },
        ],
      },
    ],
  },
  {
    id: "deliveries-api",
    title: "Deliveries",
    group: "API reference",
    lead: "Every attempt to send an event to an endpoint, with status, timing and response.",
    updatedAt: "2026-10-14",
    minutes: 2,
    sections: [
      {
        id: "delivery-object",
        title: "The Delivery object",
        blocks: [
          {
            type: "table",
            head: ["Field", "Type", "Description"],
            rows: [
              ["id", "string", "Unique ID, prefixed dlv_"],
              ["status", "enum", "succeeded, failed or dead_lettered"],
              ["attempt", "integer", "1 to 3"],
              ["duration_ms", "integer", "Time until the endpoint answered"],
            ],
          },
        ],
      },
    ],
  },
];
export const listDocsPages = pages;
export const languages: {
  id: "node" | "python" | "go" | "curl";
  label: string;
}[] = [
  { id: "node", label: "Node.js" },
  { id: "python", label: "Python" },
  { id: "go", label: "Go" },
  { id: "curl", label: "cURL" },
];

export const topNav = [
  { label: "Guides", groups: ["Getting started", "Webhooks"] },
  { label: "API reference", groups: ["API reference"] },
];
