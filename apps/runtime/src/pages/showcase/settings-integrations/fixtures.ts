// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Integration } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const listIntegrations: Integration[] = [
  { id: "github", name: "GitHub", category: "Source", description: "Sync issues, link PRs, and post deploy events.", connected: true, docsUrl: "#docs-github", configureHref: "#configure-github" },
  { id: "linear", name: "Linear", category: "Project", description: "Two-way sync issues and projects.", connected: true, docsUrl: "#docs-linear", configureHref: "#configure-linear" },
  { id: "slack", name: "Slack", category: "Notify", description: "Pipe activity and alerts into channels.", connected: true, docsUrl: "#docs-slack", configureHref: "#configure-slack" },
  { id: "stripe", name: "Stripe", category: "Billing", description: "Customer + subscription state in real time.", connected: false, badge: "New", docsUrl: "#docs-stripe" },
  { id: "vercel", name: "Vercel", category: "Deploy", description: "Trigger preview deployments and deploy hooks.", connected: false, docsUrl: "#docs-vercel" },
  { id: "datadog", name: "Datadog", category: "Observability", description: "Send domain events as Datadog metrics.", connected: false, docsUrl: "#docs-datadog" },
  { id: "sentry", name: "Sentry", category: "Observability", description: "Attach traces to user activity.", connected: false, docsUrl: "#docs-sentry" },
  { id: "notion", name: "Notion", category: "Docs", description: "Embed pages and sync content blocks.", connected: false, docsUrl: "#docs-notion" },
  { id: "figma", name: "Figma", category: "Design", description: "Embed frames and watch components.", connected: false, badge: "Beta", docsUrl: "#docs-figma" },
];

export const connectIntegration = { redirectUrl: "https://example.com/oauth/authorize" };
