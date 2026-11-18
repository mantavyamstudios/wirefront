// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { DiffFile, PullRequest, ReviewPerson, ReviewThread } from "./schema";

/** The demo clock; comment times are relative to it. */
export const now = "2026-05-12T15:00:00Z";

/** Demo data for the showcase, the generated mocks and tests. */
export const me = "maya";

export const people: ReviewPerson[] = [
  { id: "maya", name: "Maya Okafor", tone: "teal" },
  { id: "sam", name: "Sam Whitfield", tone: "amber" },
  { id: "leo", name: "Leo Marchetti", tone: "rose" },
  { id: "jonas", name: "Jonas Weber", tone: "blue" },
];

export const getPullRequest: PullRequest = { number: 482, title: "Park poison messages after three failed attempts", author: "sam", base: "main", head: "sam/dead-letter-queue", commits: 4, checks: { passed: 12, total: 12 }, reviewers: ["leo", "jonas"] };

/** Files already marked viewed. */
export const viewed = ["docs/webhooks/retries.md"];

export const listPullFiles: DiffFile[] = [
  {
    path: "src/queue/consumer.ts",
    status: "modified",
    hunks: [
      {
        header: "@@ -1,7 +1,8 @@",
        oldStart: 1,
        newStart: 1,
        lines: ` import { Queue, type Message } from "./queue";
 import { deliver } from "../delivery";
-import { backoff } from "./retry";
+import { backoff, MAX_ATTEMPTS } from "./retry";
+import { deadLetter } from "./dead-letter";
 import { metrics } from "../metrics";

 const queue = new Queue("webhooks");`,
      },
      {
        header: "@@ -38,15 +39,31 @@ export async function consume(batchSize = 50)",
        oldStart: 38,
        newStart: 39,
        lines: ` export async function consume(batchSize = 50) {
   const messages = await queue.receive(batchSize);

   for (const message of messages) {
-    try {
-      await deliver(message.body);
-      await queue.ack(message);
-    } catch (error) {
-      await queue.retry(message, backoff(message.attempts));
-    }
+    await handle(message);
   }

   metrics.gauge("webhooks.lag", await queue.lag());
 }
+
+async function handle(message: Message) {
+  try {
+    await deliver(message.body);
+    await queue.ack(message);
+  } catch (error) {
+    if (message.attempts + 1 >= MAX_ATTEMPTS) {
+      // Park it so one bad payload can't hold up the partition.
+      await deadLetter.put(message, error);
+      await queue.ack(message);
+      metrics.increment("webhooks.dead_lettered");
+      return;
+    }
+    await queue.retry(message, backoff(message.attempts));
+  }
+}`,
      },
    ],
  },
  {
    path: "src/queue/dead-letter.ts",
    status: "added",
    hunks: [
      {
        header: "@@ -0,0 +1,35 @@",
        oldStart: 0,
        newStart: 1,
        lines: `+import { db } from "../db";
+import type { Message } from "./queue";
+
+const RETENTION_DAYS = 7;
+
+export interface DeadLetter {
+  id: string;
+  endpointId: string;
+  payload: unknown;
+  error: string;
+  attempts: number;
+  parkedAt: Date;
+}
+
+export const deadLetter = {
+  async put(message: Message, error: unknown) {
+    await db.insert("dead_letters", {
+      id: message.id,
+      endpointId: message.endpointId,
+      payload: message.body,
+      error: String(error),
+      attempts: message.attempts + 1,
+      parkedAt: new Date(),
+    });
+  },
+
+  async replay(id: string) {
+    const row = await db.take<DeadLetter>("dead_letters", id);
+    return row && queue.publish(row.payload, { endpointId: row.endpointId });
+  },
+
+  async sweep() {
+    await db.deleteOlderThan("dead_letters", "parkedAt", RETENTION_DAYS);
+  },
+};`,
      },
    ],
  },
  {
    path: "src/queue/retry.ts",
    status: "modified",
    hunks: [
      {
        header: "@@ -1,11 +1,8 @@",
        oldStart: 1,
        newStart: 1,
        lines: `+export const MAX_ATTEMPTS = 3;
 const BASE_DELAY_MS = 1_000;
-const MAX_DELAY_MS = 60_000;
+const MAX_DELAY_MS = 30_000;

 export function backoff(attempt: number) {
-  const delay = BASE_DELAY_MS * 2 ** attempt;
-  if (delay > MAX_DELAY_MS) {
-    return MAX_DELAY_MS;
-  }
-  return delay;
+  const delay = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempt);
+  return delay / 2 + Math.random() * (delay / 2);
 }`,
      },
    ],
  },
  {
    path: "test/consumer.test.ts",
    status: "added",
    hunks: [
      {
        header: "@@ -0,0 +1,26 @@",
        oldStart: 0,
        newStart: 1,
        lines: `+import { describe, expect, it } from "vitest";
+import { consume } from "../src/queue/consumer";
+import { fakeQueue, failingEndpoint } from "./fixtures";
+
+describe("consume", () => {
+  it("parks a message after three failed attempts", async () => {
+    const queue = fakeQueue([{ id: "m1", attempts: 2, body: "{" }]);
+    failingEndpoint("ep_live_42");
+
+    await consume();
+
+    expect(queue.deadLetters).toHaveLength(1);
+    expect(queue.pending).toHaveLength(0);
+  });
+
+  it("keeps delivering after a poison message", async () => {
+    const queue = fakeQueue([
+      { id: "bad", attempts: 2, body: "{" },
+      { id: "ok", attempts: 0, body: "{}" },
+    ]);
+
+    await consume();
+
+    expect(queue.delivered).toContain("ok");
+  });
+});`,
      },
    ],
  },
  {
    path: "docs/webhooks/retries.md",
    status: "modified",
    hunks: [
      {
        header: "@@ -12,9 +12,13 @@ ## Retries",
        oldStart: 12,
        newStart: 12,
        lines: ` ## Retries

-Failed deliveries are retried with exponential backoff for up to 24 hours.
+Failed deliveries are retried up to three times with exponential backoff
+and jitter, capped at 30 seconds between attempts.
+
+After the third failure the event moves to the dead-letter queue, where it
+stays for 7 days. You can replay it from the dashboard at any time.

 ## Ordering

-Events for one endpoint are delivered in order.
+Events for one endpoint are delivered in order, except for events that were
+dead-lettered and replayed later.`,
      },
    ],
  },
];


export const listReviewThreads: ReviewThread[] = [
  {
    id: "t1",
    file: "src/queue/consumer.ts",
    line: 3,
    side: "new",
    comments: [
      { id: "c1", author: "leo", body: "Should `MAX_ATTEMPTS` come from the endpoint’s retry policy? Ops will want to tune it for the noisy integrations.", createdAt: "2026-05-12T13:00:00Z" },
      { id: "c2", author: "sam", body: "Fair. I’d keep the constant as the default and read `endpoint.retryPolicy` in a follow-up, so this one stays small.", createdAt: "2026-05-12T14:00:00Z" },
    ],
  },
  { id: "t2", file: "src/queue/dead-letter.ts", line: 29, side: "new", comments: [{ id: "c3", author: "leo", body: "`queue` isn’t imported in this file, so `replay` will throw the first time someone clicks it.", createdAt: "2026-05-12T14:12:00Z" }] },
  {
    id: "t3",
    file: "src/queue/retry.ts",
    line: 3,
    side: "new",
    resolved: true,
    comments: [
      { id: "c4", author: "jonas", body: "30s cap feels low for endpoints that are down for a deploy.", createdAt: "2026-05-12T12:00:00Z" },
      { id: "c5", author: "sam", body: "It only applies to the three attempts now. Anything longer goes to the dead-letter queue.", createdAt: "2026-05-12T12:05:00Z" },
    ],
  },
];
