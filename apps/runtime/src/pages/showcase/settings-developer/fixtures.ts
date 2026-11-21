// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { DebugLogLine, DeveloperSettings } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const getDeveloperSettings: DeveloperSettings = {
  groups: [
    {
      id: "ui",
      title: "UI",
      flags: [
        { key: "experimental-mentions-v2", description: "Re-architected mentions popover with portal-based positioning.", status: "experimental", enabled: false },
        { key: "command-bar-fuzzy", description: "Fuzzy ranking on the global command bar instead of prefix match.", status: "beta", enabled: true },
        { key: "sidebar-resize-handles", description: "Drag handles for resizing left and right sidebars.", status: "stable", enabled: true },
        { key: "preview-card-hover", description: "Hover card previews on internal links across the product.", status: "beta", enabled: false },
      ],
    },
    {
      id: "api",
      title: "API",
      flags: [
        { key: "graphql-batching", description: "Batch GraphQL operations into a single round-trip.", status: "stable", enabled: true },
        { key: "rest-cursor-v2", description: "Opaque cursor pagination on list endpoints.", status: "beta", enabled: true },
        { key: "webhooks-retries-v3", description: "Exponential retry with jitter and DLQ surfacing.", status: "experimental", enabled: false },
      ],
    },
    {
      id: "ai",
      title: "AI",
      flags: [
        { key: "smart-summaries", description: "Generate thread summaries with the local model.", status: "beta", enabled: true },
        { key: "inline-rewrite", description: "Slash-command rewrites inside the editor.", status: "experimental", enabled: false },
        { key: "agent-actions", description: "Allow agents to call write-side tools (create, update).", status: "experimental", enabled: false },
      ],
    },
    {
      id: "performance",
      title: "Performance",
      flags: [
        { key: "query-cache-persist", description: "Persist react-query cache to IndexedDB across reloads.", status: "stable", enabled: true },
        { key: "list-virtualization", description: "Virtualize lists over 200 rows.", status: "stable", enabled: true },
        { key: "speculative-prefetch", description: "Prefetch routes on link hover after 80ms.", status: "beta", enabled: false },
      ],
    },
  ],
  debug: false,
  environments: [
    { id: "production", label: "Production", host: "api.example.dev" },
    { id: "staging", label: "Staging", host: "api.staging.example.dev" },
    { id: "local", label: "Local", host: "localhost:4000" },
  ],
  environment: "production",
  canSwitchEnvironment: false,
};

const at = (ms: number) => new Date(Date.UTC(2026, 3, 20, 12, 4, 1) + ms).toISOString();
export const logLines: DebugLogLine[] = [
  { id: "l1", at: at(221), level: "info", channel: "evt:render", message: '"/dashboard"  87ms' },
  { id: "l2", at: at(310), level: "info", channel: "api:GET", message: "/api/users     id=req_abc  204" },
  { id: "l3", at: at(412), level: "debug", channel: "cache:hit", message: "projects:atlas ttl=12s" },
  { id: "l4", at: at(587), level: "warn", channel: "evt:render", message: '"/inbox"      312ms  (slow)' },
  { id: "l5", at: at(601), level: "info", channel: "api:POST", message: "/api/messages  id=req_acd  201" },
  { id: "l6", at: at(744), level: "debug", channel: "ws:tick", message: "presence n=23 dt=2.1s" },
  { id: "l7", at: at(812), level: "error", channel: "api:POST", message: "/api/billing   id=req_acf  402  card_declined" },
  { id: "l8", at: at(901), level: "info", channel: "evt:nav", message: '"/billing" -> "/billing/invoices"  44ms' },
];
