// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type {
  ConsoleDeploy,
  ConsoleService,
  IncidentUpdate,
  StatusOverview,
} from "./schema";

/** Demo data for the showcase, the generated mocks and tests: a webhook incident in progress. */
export const now = "2026-04-24T13:06:00Z";
export const currentUserId = "maya";
export const environments = ["Production", "Staging"];

const POINTS = 40;
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const rnd = seeded(7);
/** A p95 trend; degraded services climb towards their current value. */
function trend(p95: number, climbing = false) {
  return Array.from({ length: POINTS }, (_, i) =>
    Math.round(
      (climbing ? p95 * (0.25 + (i / POINTS) * 0.85) : p95) *
        (0.92 + rnd() * 0.16)
    )
  );
}

const service = (
  s: Omit<ConsoleService, "p95Trend">,
  climbing = false
): ConsoleService => ({ ...s, p95Trend: trend(s.p95Ms, climbing) });

export const services: ConsoleService[] = [
  service({
    id: "api",
    name: "API gateway",
    health: "operational",
    p95Ms: 84,
    errorRate: 0.0002,
    uptime: 0.9999,
    region: "eu-west",
  }),
  service(
    {
      id: "webhooks",
      name: "Webhook delivery",
      health: "degraded",
      p95Ms: 4100,
      errorRate: 0.024,
      uptime: 0.9971,
      region: "eu-west",
    },
    true
  ),
  service({
    id: "ingest",
    name: "Event ingest",
    health: "operational",
    p95Ms: 41,
    errorRate: 0.0001,
    uptime: 0.9999,
    region: "eu-west",
  }),
  service({
    id: "queue",
    name: "Queue",
    health: "operational",
    p95Ms: 12,
    errorRate: 0,
    uptime: 1,
    region: "eu-west",
  }),
  service({
    id: "db",
    name: "Postgres primary",
    health: "operational",
    p95Ms: 6,
    errorRate: 0,
    uptime: 0.9998,
    region: "eu-west",
  }),
  service({
    id: "auth",
    name: "Auth",
    health: "operational",
    p95Ms: 63,
    errorRate: 0.0003,
    uptime: 0.9999,
    region: "global",
  }),
  service({
    id: "dashboard",
    name: "Dashboard",
    health: "operational",
    p95Ms: 210,
    errorRate: 0.0005,
    uptime: 0.9997,
    region: "global",
  }),
  service({
    id: "search",
    name: "Search",
    health: "operational",
    p95Ms: 118,
    errorRate: 0.0004,
    uptime: 0.9995,
    region: "eu-west",
  }),
  service({
    id: "billing",
    name: "Billing",
    health: "operational",
    p95Ms: 152,
    errorRate: 0.0001,
    uptime: 0.9999,
    region: "us-east",
  }),
];

const at = (hhmm: string) => `2026-04-24T${hhmm}:00Z`;

export const openingUpdates: IncidentUpdate[] = [
  {
    id: "u1",
    at: at("12:58"),
    state: "alert",
    text: "webhooks.lag above 2 minutes for 5 minutes in eu-west.",
    by: "bot",
  },
  {
    id: "u2",
    at: at("13:02"),
    state: "investigating",
    text: "Deliveries are delayed for some endpoints. p95 delivery time is about 4 minutes. Looking into it.",
    by: "sam",
  },
];

/** What happens next in the demo, in order. */
export const laterUpdates: IncidentUpdate[] = [
  {
    id: "u3",
    at: at("13:09"),
    state: "identified",
    text: "One malformed payload is blocking the consumer for partition 7. Rolling out a fix that parks it in the dead-letter queue.",
    by: "sam",
  },
  {
    id: "u4",
    at: at("13:14"),
    state: "monitoring",
    text: "Fix is live. Backlog draining: 42,180 → 6,904 queued.",
    by: "leo",
  },
  {
    id: "u5",
    at: at("13:21"),
    state: "resolved",
    text: "Deliveries are back to normal. 312 events were dead-lettered and replayed.",
    by: "sam",
  },
];

export const fixDeploy: ConsoleDeploy = {
  id: "fix",
  sha: "a1f9c3e",
  message: "Park poison messages after 3 attempts",
  serviceId: "webhooks",
  authorId: "sam",
  at: at("13:09"),
  status: "rolling",
  progress: 0,
};

export const deploys: ConsoleDeploy[] = [
  {
    id: "d1",
    sha: "7c2e91a",
    message: "Raise ingest batch size to 500",
    serviceId: "ingest",
    authorId: "leo",
    at: at("12:06"),
    status: "succeeded",
  },
  {
    id: "d2",
    sha: "e04b6d2",
    message: "Starter pricing copy",
    serviceId: "dashboard",
    authorId: "jonas",
    at: at("10:06"),
    status: "succeeded",
  },
  {
    id: "d3",
    sha: "51fa0c7",
    message: "Search: rebuild index on deploy",
    serviceId: "search",
    authorId: "leo",
    at: at("08:06"),
    status: "rolled-back",
  },
  {
    id: "d4",
    sha: "9ad3e18",
    message: "Rotate JWT signing keys",
    serviceId: "auth",
    authorId: "sam",
    at: "2026-04-23T15:40:00Z",
    status: "succeeded",
  },
];

const uptimeRnd = seeded(23);
const uptimeDays = Array.from({ length: 60 }, (_, i) => ({
  date: new Date(Date.UTC(2026, 3, 24) - (59 - i) * 86_400_000)
    .toISOString()
    .slice(0, 10),
  degradedMinutes: i === 59 ? 23 : uptimeRnd() > 0.95 ? 12 : 0,
}));

export const getStatus: StatusOverview = {
  services,
  people: [
    { id: "sam", name: "Sam Whitfield", category: 3, role: "Platform" },
    { id: "leo", name: "Leo Marchetti", category: 4, role: "Platform" },
    { id: "maya", name: "Maya Okafor", category: 6, role: "Product" },
    { id: "jonas", name: "Jonas Weber", category: 1, role: "Growth" },
    { id: "bot", name: "Kestrel Monitor", category: 5, bot: true },
  ],
  incident: {
    id: "inc-318",
    ref: "INC-318",
    severity: "SEV-2",
    title: "Webhook deliveries delayed in eu-west",
    startedAt: at("12:58"),
    updates: openingUpdates,
  },
  deploys,
  onCall: {
    team: "Platform",
    until: "2026-04-27T08:00:00Z",
    primary: { personId: "sam", timeZone: "Europe/London", city: "London" },
    secondary: { personId: "leo", timeZone: "Europe/Lisbon", city: "Lisbon" },
  },
  uptime: { value: 0.9994, days: uptimeDays },
};

/** A quiet environment: no incident, everything healthy. */
export const quietStatus: StatusOverview = {
  ...getStatus,
  services: services.map((s) => ({
    ...s,
    health: "operational",
    p95Ms: s.id === "webhooks" ? 180 : s.p95Ms,
    p95Trend: s.id === "webhooks" ? trend(180) : s.p95Trend,
    errorRate: Math.min(s.errorRate, 0.0004),
  })),
  incident: null,
  deploys: [],
  uptime: {
    value: 1,
    days: uptimeDays.map((d) => ({ ...d, degradedMinutes: 0 })),
  },
};
