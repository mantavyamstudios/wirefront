// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { DeveloperData, Delivery, Endpoint, KeyWithSecret } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-10-27T12:00:00.000Z";
export const product = "Ridgeline";
const ago = (minutes: number) => new Date(Date.parse(now) - minutes * 60_000).toISOString();
const inDays = (days: number) => new Date(Date.parse(now) + days * 86_400_000).toISOString();

/** What the mocks return for `getDeveloper`. */
export const getDeveloper: DeveloperData = {
  resources: [
    { id: "projects", name: "Projects" },
    { id: "deployments", name: "Deployments" },
    { id: "domains", name: "Domains" },
    { id: "env", name: "Environment variables" },
    { id: "webhooks", name: "Webhooks" },
    { id: "logs", name: "Logs", readOnly: true },
  ],
  keys: [
    { id: "k1", name: "GitHub Actions deploy", prefix: "dvl_test_", last4: "8f2a", scopes: ["write:deployments", "read:deployments", "read:projects", "read:logs"], expiresAt: inDays(100), lastUsedAt: ago(2) },
    { id: "k2", name: "Status page sync", prefix: "dvl_test_", last4: "41ad", scopes: ["read:deployments", "read:logs"], expiresAt: inDays(7), lastUsedAt: ago(180) },
    { id: "k3", name: "Terraform", prefix: "dvl_test_", last4: "c07e", scopes: ["write:projects", "read:projects", "write:deployments", "read:deployments", "write:domains", "read:domains", "write:env", "read:env", "read:logs"], expiresAt: null, lastUsedAt: ago(41 * 1440) },
    { id: "k4", name: "Jonah’s local scripts", prefix: "dvl_test_", last4: "9b13", scopes: ["read:projects", "read:env"], expiresAt: inDays(23), lastUsedAt: null },
  ],
  eventGroups: [
    { id: "deployment", name: "Deployments", events: [
      { id: "deployment.created", hint: "A build starts" },
      { id: "deployment.succeeded", hint: "A build is ready" },
      { id: "deployment.failed", hint: "A build or check fails" },
      { id: "deployment.promoted", hint: "A preview goes to production" },
    ] },
    { id: "project", name: "Projects", events: [
      { id: "project.created", hint: "A project is created" },
      { id: "project.deleted", hint: "A project is deleted" },
    ] },
    { id: "domain", name: "Domains", events: [
      { id: "domain.verified", hint: "DNS checks pass" },
      { id: "domain.expiring", hint: "A certificate is close to expiry" },
    ] },
    { id: "member", name: "Members", events: [
      { id: "member.added", hint: "Someone joins" },
      { id: "member.removed", hint: "Someone leaves" },
    ] },
  ],
  endpoints: [
    { id: "e1", url: "https://api.paperkite.app/webhooks/ridgeline", paused: false,
      events: ["deployment.created", "deployment.succeeded", "deployment.failed", "deployment.promoted", "project.created"],
      deliveries: [
        { id: "d1", event: "deployment.failed", status: 503, latencyMs: 2140, at: ago(2) },
        { id: "d2", event: "deployment.succeeded", status: "timeout", latencyMs: 10000, at: ago(9) },
        { id: "d3", event: "deployment.promoted", status: 200, latencyMs: 182, at: ago(60) },
        { id: "d4", event: "deployment.created", status: 200, latencyMs: 164, at: ago(62) },
        { id: "d5", event: "project.created", status: 201, latencyMs: 240, at: ago(180) },
      ] },
    { id: "e2", url: "https://ops.ridgeline.app/hooks/deploy-bot", paused: false,
      events: ["deployment.failed", "domain.verified", "domain.expiring", "member.added", "member.removed"],
      deliveries: [
        { id: "d6", event: "member.added", status: 204, latencyMs: 96, at: ago(26) },
        { id: "d7", event: "domain.verified", status: 204, latencyMs: 88, at: ago(120) },
        { id: "d8", event: "deployment.failed", status: 204, latencyMs: 131, at: ago(1500) },
      ] },
    { id: "e3", url: "https://ci.grovehouse.io/preview-comments", paused: true, events: ["deployment.succeeded"],
      deliveries: [{ id: "d9", event: "deployment.succeeded", status: 200, latencyMs: 301, at: ago(15 * 1440) }] },
  ],
};

/** What the mocks return for `createKey` and `rollKey`. */
export const createKey: KeyWithSecret = {
  key: { id: "k_new", name: "Release pipeline", prefix: "dvl_test_", last4: "7c2e", scopes: ["read:projects"], expiresAt: inDays(90), lastUsedAt: null },
  secret: "dvl_test_Q8mVx2Lr7TfK9pZw1Dn4Yc6hBs3Ea7c2e",
};
export const rollKey: KeyWithSecret = { key: { ...createKey.key, id: "k1", name: "GitHub Actions deploy", last4: "d41f" }, secret: "dvl_test_Wn3Kq8Rz1Vx6Lp2Ty9Mf4Hc7Gb5Jsd41f" };

/** What the mocks return for `createEndpoint`. */
export const createEndpoint: Endpoint = { id: "e_new", url: "https://example.com/webhooks", paused: false, events: ["deployment.failed"], deliveries: [] };

/** What the mocks return for `getSigningSecret` and `rollSigningSecret`. */
export const getSigningSecret = { secret: "rlsig_test_Q2m8vLx4TfR9kZp1Wd7nYc3h" };
export const rollSigningSecret = { secret: "rlsig_test_Ve5Np8Kd2Wq9Lx3Ry7Bc1Hm4" };

/** What the mocks return for `sendTest` and `retryDeliveries`. */
export const sendTest: Delivery = { id: "d_test", event: "ping", status: 200, latencyMs: 142, at: now };
export const retryDeliveries: Delivery[] = [{ id: "d1", event: "deployment.failed", status: 200, latencyMs: 188, at: now }];
