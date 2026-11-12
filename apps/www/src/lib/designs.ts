// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ComponentType } from "react";
import {
  WireframeAI,
  WireframeApps,
  WireframeCommerce,
  WireframeDevTools,
  WireframePersonal,
  WireframeAuth,
  WireframeCalendars,
  WireframeCard,
  WireframeCharts,
  WireframeDashboard,
  WireframeEmptyState,
  WireframeFilters,
  WireframeForm,
  WireframeModals,
  WireframePricing,
  WireframeProfile,
  WireframeSettings,
  WireframeSidebar,
  WireframeTable,
  WireframeThreads,
  WireframeTimelines,
  WireframeToasts,
  WireframeTours,
} from "@/components/wireframe-icons";

export type CategorySlug =
  | "layouts"
  | "forms"
  | "auth"
  | "dashboards"
  | "tables"
  | "filters"
  | "empty-states"
  | "settings"
  | "cards"
  | "modals"
  | "charts"
  | "timelines"
  | "calendars"
  | "profile"
  | "toasts"
  | "pricing"
  | "tours"
  | "threads"
  | "ai"
  | "dev-tools"
  | "apps"
  | "personal"
  | "commerce";

export type DesignStatus = "new" | "wip";

export interface Design {
  slug: string;
  title: string;
  blurb: string;
  status?: DesignStatus;
}

export interface Category {
  slug: CategorySlug;
  title: string;
  blurb: string;
  Icon: ComponentType<{ className?: string }>;
  designs: Design[];
}

export const CATEGORIES: Category[] = [
  {
    slug: "layouts",
    title: "Layouts",
    blurb: "App shells, sidebars, multi-pane splits, focus modes, canvases.",
    Icon: WireframeSidebar,
    designs: [
      {
        slug: "workspace-rail",
        title: "Workspace rail",
        blurb: "Workspace switcher, sections, projects, user row.",
      },
      {
        slug: "mini-rail",
        title: "Mini icon rail",
        blurb: "Collapsed 60px rail with workspace dots and active marker.",
      },
      {
        slug: "docs-tree",
        title: "Docs tree",
        blurb: "Nested folder/file tree with expand/collapse and search.",
      },
      {
        slug: "inbox-rail",
        title: "Inbox rail",
        blurb: "Conversation list with unread dots, tabs, and avatars.",
      },
      {
        slug: "app-shell",
        title: "App shell",
        blurb: "Top bar + left sidebar + main content — the canonical product frame.",
      },
      {
        slug: "two-pane",
        title: "Two-pane",
        blurb: "List on left, detail on right — Mail / Linear desktop pattern.",
      },
      {
        slug: "three-pane",
        title: "Three-pane",
        blurb: "Workspace rail + channel list + main — Slack-style shell.",
      },
      {
        slug: "split-resizable",
        title: "Split resizable",
        blurb: "Two panes with a draggable handle — code editor + live preview.",
      },
      {
        slug: "focus-mode",
        title: "Focus mode",
        blurb: "Toggleable distraction-free reading layout with collapsing rails.",
      },
      {
        slug: "floating-toolbar",
        title: "Floating toolbar",
        blurb: "Selection-anchored bubble menu over a rich-text document.",
      },
      {
        slug: "canvas-tools",
        title: "Canvas tools",
        blurb: "Full-bleed canvas with floating tool palette + inspector — Figma-style.",
      },
      {
        slug: "bottom-nav",
        title: "Bottom nav",
        blurb: "Mobile shell inside a phone-frame mock with a 5-tab bottom bar.",
      },
      {
        slug: "inset-shell",
        title: "Inset Shell",
        blurb: "The frame an app lives in: a sidebar with workspace switcher, nav, colour-dotted projects and an account menu that folds down to an icon rail, beside a rounded inset page with live breadcrumbs and a floating drawer on phones.",
        status: "new",
      },
      {
        slug: "hairline-shell",
        title: "Hairline Shell",
        blurb: "An app frame drawn edge to edge on single hairlines, with header and footer rules running straight across, a marker that slides along the edge to the current page and a dense issue list you can walk with J and K.",
        status: "new",
      },
      {
        slug: "split-shell",
        title: "Split Shell",
        blurb: "A frame for working with an agent: tasks on the left, its thread in the middle, and a work panel you can drag or nudge with arrow keys to watch its tool calls tick by, the page it's reading and the sources it will cite.",
        status: "new",
      },
    ],
  },
  {
    slug: "forms",
    title: "Forms",
    blurb: "Settings, invites, preferences, API keys.",
    Icon: WireframeForm,
    designs: [
      {
        slug: "workspace-settings",
        title: "Workspace settings",
        blurb: "Sidebar nav, sectioned form, sticky save bar.",
      },
      {
        slug: "invite-teammates",
        title: "Invite teammates",
        blurb: "Multi-row email + role with optional message.",
      },
      {
        slug: "notifications",
        title: "Notification preferences",
        blurb: "Grouped switch matrix for email and push.",
      },
      {
        slug: "api-key",
        title: "Create API key",
        blurb: "Scope checkboxes, expiry, post-create reveal.",
      },
    ],
  },
  {
    slug: "auth",
    title: "Auth & Onboarding",
    blurb: "Sign-in, magic-link, OAuth, waitlist.",
    Icon: WireframeAuth,
    designs: [
      {
        slug: "login",
        title: "Login",
        blurb: "Split layout — particle field, magic-link + OAuth.",
      },
      {
        slug: "onboarding",
        title: "Onboarding",
        blurb: "Multi-step workspace setup with progress dots.",
      },
      {
        slug: "waitlist",
        title: "Waitlist landing",
        blurb: "Full-bleed empty-room figure with soft CTA.",
      },
      {
        slug: "check-email",
        title: "Check your email",
        blurb: "Magic-link sent confirmation with resend countdown and re-route options.",
      },
      {
        slug: "inset-login",
        title: "Inset login",
        blurb: "Dark cloth split inside a rounded card — OAuth, magic link, password.",
      },
      {
        slug: "centered-signin",
        title: "Centered signin",
        blurb: "Classic centered card on a soft gradient — OAuth + email/password.",
      },
      {
        slug: "centered-signup",
        title: "Centered signup",
        blurb: "Benefit pills, OAuth row, full signup form with a live strength meter.",
      },
      {
        slug: "left-signin",
        title: "Left signin",
        blurb: "Form left, testimonial card + customer logo strip on the right.",
      },
      {
        slug: "right-signin",
        title: "Right signin",
        blurb: "Feature hero left with a dashboard mock, signin card on the right.",
        status: "wip",
      },
      {
        slug: "glass-signup",
        title: "Glass signup",
        blurb: "Glass-morphic card over five drifting blurred color blobs.",
        status: "wip",
      },
      {
        slug: "otp-verify",
        title: "OTP verify",
        blurb: "6-digit code entry with split separator and live resend countdown.",
      },
      {
        slug: "reset-password",
        title: "Reset password",
        blurb: "Two-state flow — request → success — with a demo toggle in the corner.",
      },
      {
        slug: "two-factor",
        title: "Two-factor",
        blurb: "Authenticator code with switch + recovery-code fallback state.",
      },
      {
        slug: "magic-link-sent",
        title: "Magic link sent",
        blurb: "Animated envelope confirmation with Open Gmail and resend countdown.",
      },
      {
        slug: "sign-in",
        title: "Sign In",
        blurb: "A minimal centred sign-in: passkey and single sign-on side by side, email and password with a show toggle, a gentle shake when the password is wrong and a check when you’re in.",
        status: "new",
      },
      {
        slug: "sign-up",
        title: "Sign Up",
        blurb: "A minimal centred sign-up: name, work email and a password whose length hint ticks green as you type, with inline errors and the terms in one quiet line.",
        status: "new",
      },
      {
        slug: "forgot-password",
        title: "Forgot Password",
        blurb: "Ask for a reset link, then a confirmation with the address it went to, a resend countdown and a way back to sign in.",
        status: "new",
      },
      {
        slug: "verify-email",
        title: "Verify Email",
        blurb: "The 6-digit code step: a centred code field split 3 + 3, a shake when the code is wrong, a resend timer that counts down and a mail icon that turns into a check.",
        status: "new",
      },
      {
        slug: "first-run",
        title: "First Run",
        blurb: "A four-step setup for a brand-new AI workspace, with a springy stepper, tools that connect right where they sit, invites as chips, a live preview of your first agent and a calm summary you can jump back from.",
        status: "new",
      },
    ],
  },
  {
    slug: "dashboards",
    title: "Dashboards",
    blurb: "Metric grids, sparklines, activity feeds, plan usage.",
    Icon: WireframeDashboard,
    designs: [
      {
        slug: "metrics-overview",
        title: "Metrics overview",
        blurb: "Stat tiles + sparkline chart + activity feed.",
      },
      {
        slug: "usage",
        title: "Plan usage",
        blurb: "Plan summary, cycle progress, layered limit meters.",
      },
      {
        slug: "analytics",
        title: "Analytics",
        blurb: "Bar chart + breakdown cards for sources, pages, geography.",
      },
      {
        slug: "home",
        title: "Personal home",
        blurb: "Greeting, today's tasks, schedule, fact tiles.",
      },
      {
        slug: "revenue",
        title: "Revenue",
        blurb: "MRR hero with trend area, plan-tier breakdown, top accounts.",
        status: "wip",
      },
      {
        slug: "services",
        title: "Service health",
        blurb: "Services grid — status, latency p99, error sparklines, SLO budget.",
        status: "wip",
      },
      {
        slug: "engineering",
        title: "Engineering velocity",
        blurb: "DORA tiles, weekly PR throughput, CI health, contributor leaderboard.",
        status: "wip",
      },
      {
        slug: "support",
        title: "Support queue",
        blurb: "Ticket donut, SLA breach list, agent leaderboard, tag mix.",
        status: "wip",
      },
      {
        slug: "market",
        title: "Markets",
        blurb: "Featured ticker chart, watchlist with row sparklines, allocation.",
        status: "wip",
      },
      {
        slug: "revenue-overview",
        title: "Revenue Story",
        blurb: "A store's revenue told as a story: one big annotated line you can scrub day by day against last period, a plain-sentence summary whose numbers roll, a range switch that morphs the line and moves its notes, and a ranked strip of where the money came from.",
        status: "new",
      },
      {
        slug: "status-console",
        title: "Status Console",
        blurb: "An ops console where an incident plays out live: services with ticking p95 sparklines, a timeline that moves from investigating to resolved, the fix rolling out in recent deploys, and an on-call card you can page from the keyboard.",
        status: "new",
      },
      {
        slug: "pipeline-today",
        title: "Pipeline Today",
        blurb: "A salesperson's morning view: drag deals between stages (or move them with the keyboard) while each column's weighted value and the forecast roll live, and a Focus rail tells you who to act on and why, with one-click email, call and snooze that update the deal.",
        status: "new",
      },
    ],
  },
  {
    slug: "tables",
    title: "Tables",
    blurb: "Sortable rows, density, bulk actions.",
    Icon: WireframeTable,
    designs: [
      {
        slug: "invoices",
        title: "Invoices",
        blurb: "Semantic table with status pills and right-aligned tabular amounts.",
      },
      {
        slug: "members",
        title: "Team members",
        blurb: "Avatars, role select cells, last-active time, and a row action menu.",
        status: "wip",
      },
      {
        slug: "orders",
        title: "Orders",
        blurb: "Card-variant table with selection checkboxes and timeline status.",
      },
      {
        slug: "logs",
        title: "Server logs",
        blurb: "Dense monospace log viewer with severity dots and request IDs.",
      },
      {
        slug: "api-keys",
        title: "API keys",
        blurb: "Masked keys with copy buttons, scopes, and a destructive row action.",
        status: "wip",
      },
      {
        slug: "inventory",
        title: "Inventory",
        blurb: "Product rows with thumbnails, SKU, and stock-level meters.",
      },
      {
        slug: "issues",
        title: "Issue tracker",
        blurb: "Issues grid with faceted filter row above — Linear-style filtering.",
      },
      {
        slug: "transactions",
        title: "Transactions",
        blurb: "Transactions table with a search + select toolbar and pagination.",
      },
      {
        slug: "audit-log",
        title: "Audit log",
        blurb: "Audit trail with active filter chips and a clear-all action.",
      },
      {
        slug: "admin-users",
        title: "Admin Users",
        blurb: "A members admin with seat and 2FA stats, role and status filters, a sortable table you can bulk-edit, an invite dialog that checks emails as chips, and a drawer with each person's devices and activity.",
        status: "new",
      },
    ],
  },
  {
    slug: "filters",
    title: "Filters",
    blurb: "Toolbars, faceted popovers, chips, and sidebar filter rails.",
    Icon: WireframeFilters,
    designs: [
      {
        slug: "toolbar",
        title: "Filter toolbar",
        blurb: "Search, select, date range, and a view-density toggle in one bar.",
      },
      {
        slug: "faceted",
        title: "Faceted popover",
        blurb: "Linear-style add-filter popover with multi-select checkbox facets.",
      },
      {
        slug: "chips",
        title: "Active filter chips",
        blurb: "Removable filter pills with operators and a clear-all action.",
      },
      {
        slug: "sidebar",
        title: "Filter sidebar",
        blurb: "Left rail with collapsible sections, sliders, and switches.",
        status: "wip",
      },
    ],
  },
  {
    slug: "empty-states",
    title: "Empty states",
    blurb: "First-run, zero-data, end-of-list.",
    Icon: WireframeEmptyState,
    designs: [
      {
        slug: "inbox-zero",
        title: "Inbox zero",
        blurb: "All caught up — soft sunrise gradient with quiet actions.",
      },
      {
        slug: "no-results",
        title: "No results",
        blurb: "Search with active filter pills and a one-click reset.",
      },
      {
        slug: "first-project",
        title: "First project",
        blurb: "Day-one workspace with create or import-from-Linear paths.",
      },
      {
        slug: "end-of-feed",
        title: "End of feed",
        blurb: "Activity list with a 'you're all caught up' end marker.",
      },
      {
        slug: "no-team",
        title: "No teammates",
        blurb: "Invite link with placeholder avatar slots and email CTA.",
        status: "wip",
      },
      {
        slug: "trash",
        title: "Empty trash",
        blurb: "Settings-style trash folder with 30-day retention copy.",
      },
      {
        slug: "404",
        title: "404",
        blurb: "Big numerals on a faded grid backdrop with go-back actions.",
      },
      {
        slug: "maintenance",
        title: "Maintenance",
        blurb: "Scheduled downtime with live countdown and progress bar.",
      },
      {
        slug: "no-files",
        title: "No files",
        blurb: "Drag-and-drop zone with stacked file-icon preview.",
      },
      {
        slug: "offline",
        title: "Offline",
        blurb: "Connection lost with pulsing destructive ring and retry.",
      },
    ],
  },
  {
    slug: "settings",
    title: "Settings",
    blurb: "Profile, appearance, billing, integrations.",
    Icon: WireframeSettings,
    designs: [
      {
        slug: "profile",
        title: "Profile",
        blurb: "Photo, identity, locale, security rows with destructive zone.",
      },
      {
        slug: "appearance",
        title: "Appearance",
        blurb: "Mode previews, palette swatches, density toggle, font cards.",
        status: "wip",
      },
      {
        slug: "billing",
        title: "Billing",
        blurb: "Plan card, payment method, credits, invoice ledger.",
      },
      {
        slug: "integrations",
        title: "Integrations",
        blurb: "Searchable grid with category filters and connect actions.",
        status: "wip",
      },
      {
        slug: "security",
        title: "Security",
        blurb: "2FA banner, passkeys list, active sessions, recovery codes.",
      },
      {
        slug: "permissions",
        title: "Roles & permissions",
        blurb: "Role sidebar with a sticky-header capability matrix grid.",
        status: "wip",
      },
      {
        slug: "branding",
        title: "Workspace branding",
        blurb: "Logo upload, color palette + live preview, custom domain.",
      },
      {
        slug: "localization",
        title: "Localization",
        blurb: "Language, timezone, formats — with a live Intl preview card.",
      },
      {
        slug: "webhooks",
        title: "Webhooks",
        blurb: "Endpoints table, signing secret reveal, recent deliveries log.",
      },
      {
        slug: "privacy",
        title: "Privacy & data",
        blurb: "Export archive, retention sliders, account-deletion countdown.",
      },
      {
        slug: "developer",
        title: "Developer",
        blurb: "Feature flags, debug console, environment switcher.",
      },
      {
        slug: "sso",
        title: "Single sign-on",
        blurb: "IdP picker with a 4-step setup wizard and attribute mapping.",
        status: "wip",
      },
      {
        slug: "appearance-settings",
        title: "Appearance Settings",
        blurb: "Theme cards with miniature previews above a compact live app that re-themes with a circular wipe, eases into your accent colour and glides between densities as you change them.",
        status: "new",
      },
      {
        slug: "profile-settings",
        title: "Profile Settings",
        blurb: "Edit your profile: crop a generated photo in a small dialog, claim a username with a live availability check and suggestions, see your local time on a tiny clock, and save from a bar that springs up when something changes.",
        status: "new",
      },
      {
        slug: "security-settings",
        title: "Security Settings",
        blurb: "Password, two-factor, passkeys and sessions in grouped rows: a tiny ring counts recommended steps, passkeys are added inline while your device confirms, and signed-out sessions slide off the table one after another.",
        status: "new",
      },
      {
        slug: "developer-settings",
        title: "API Keys & Webhooks",
        blurb: "Scoped API keys with a show-once secret, roll and revoke, plus webhook endpoints with event picking, a signing secret and a deliveries log where failed sends retry and flip to 200.",
        status: "new",
      },
      {
        slug: "notification-settings",
        title: "Notification Settings",
        blurb: "Channels you can open and tune, per-event email, push and chat toggles grouped under section switches, quiet hours on a small 24-hour track, and a digest line whose item count rolls as you change things.",
        status: "new",
      },
      {
        slug: "team-roles",
        title: "Members & Roles",
        blurb: "Invite people, manage members and pending invites, and tune a role-by-permission matrix with a locked owner column, live head counts and a duplicate-to-customise role.",
        status: "new",
      },
      {
        slug: "settings-and-plans",
        title: "Settings & Plans",
        blurb: "Workspace, members, API keys and billing in one calm settings screen: grouped rows, an unsaved-changes bar that springs up, invites and role changes, keys shown once, and usage bars that fill when you open Billing.",
        status: "new",
      },
      {
        slug: "connectors",
        title: "Connectors",
        blurb: "Browse every app your product plugs into, grouped by category in tidy two-up cards, with a sticky search, filters that glide, connect buttons that spin and settle into a quiet connected state, and a slide-over for permissions and settings.",
        status: "new",
      },
    ],
  },
  {
    slug: "cards",
    title: "Cards",
    blurb: "Stat tiles, list items, surface containers.",
    Icon: WireframeCard,
    designs: [
      {
        slug: "stat-tile",
        title: "Stat tile",
        blurb: "KPI grid with sparklines and period-over-period delta.",
      },
      {
        slug: "profile",
        title: "Profile card",
        blurb: "Cover gradient, avatar, badges, and split actions.",
        status: "wip",
      },
      {
        slug: "pricing",
        title: "Pricing tiers",
        blurb: "Three-tier pricing with a 'most popular' callout.",
      },
      {
        slug: "product",
        title: "Product card",
        blurb: "E-commerce tile with swatches, rating, and add-to-bag CTA.",
      },
      {
        slug: "invoice",
        title: "Invoice line",
        blurb: "Compact list row with status pill and amount.",
      },
      {
        slug: "task",
        title: "Kanban task",
        blurb: "Issue card with priority, labels, assignees, and progress.",
      },
      {
        slug: "event",
        title: "Calendar event",
        blurb: "Date stripe, attendees stack, and live-meeting badge.",
      },
      {
        slug: "integration",
        title: "Integration",
        blurb: "Connected service row with health pill and Switch toggle.",
      },
      {
        slug: "media",
        title: "Article preview",
        blurb: "Editorial card with patterned cover and bookmark action.",
      },
      {
        slug: "payment-method",
        title: "Payment method",
        blurb: "Stylised credit card art with primary-card switching.",
      },
    ],
  },
  {
    slug: "modals",
    title: "Modals",
    blurb: "Dialogs, drawers, command palettes, confirmations.",
    Icon: WireframeModals,
    designs: [
      {
        slug: "confirm-delete",
        title: "Confirm delete",
        blurb: "Destructive AlertDialog with type-to-confirm phrase guard.",
      },
      {
        slug: "share-link",
        title: "Share link",
        blurb: "Permission selector, copy field, member access table.",
      },
      {
        slug: "upload-files",
        title: "Upload files",
        blurb: "Drag-zone with progress rows and per-file cancel.",
      },
      {
        slug: "command-palette",
        title: "Command palette",
        blurb: "Cmd-K overlay with grouped commands and ⌘ shortcuts.",
      },
      {
        slug: "feedback",
        title: "Feedback",
        blurb: "Bug / idea / praise picker with screenshot attach.",
        status: "wip",
      },
      {
        slug: "shortcuts",
        title: "Keyboard shortcuts",
        blurb: "Cheatsheet with grouped sections and Kbd glyphs.",
      },
      {
        slug: "upgrade",
        title: "Upgrade plan",
        blurb: "Limit-reached modal with comparison and CTA.",
      },
      {
        slug: "export",
        title: "Export data",
        blurb: "Format radio, range picker, includes checklist.",
      },
      {
        slug: "create-workspace",
        title: "Create workspace",
        blurb: "Name + slug + visibility, with live URL preview.",
      },
      {
        slug: "two-factor",
        title: "Two-factor setup",
        blurb: "QR code, recovery codes, OTP confirm step.",
      },
    ],
  },
  {
    slug: "charts",
    title: "Charts",
    blurb: "Area, bar, donut, funnel, heatmap, gauge — pure SVG.",
    Icon: WireframeCharts,
    designs: [
      {
        slug: "revenue-area",
        title: "Revenue area",
        blurb: "Stacked area chart with legend toggles and hover crosshair.",
      },
      {
        slug: "cohort-heatmap",
        title: "Cohort heatmap",
        blurb: "Retention grid with diagonal-fading opacity ramp.",
      },
      {
        slug: "funnel",
        title: "Funnel",
        blurb: "Conversion funnel with drop-off pills between stages.",
      },
      {
        slug: "gauges",
        title: "Radial gauges",
        blurb: "Three SLO gauges with target lines and breach colour.",
      },
      {
        slug: "bar-grouped",
        title: "Grouped bars",
        blurb: "Period-over-period grouped bars with axis ticks.",
      },
      {
        slug: "line-multi",
        title: "Multi-series line",
        blurb: "Three-series line with legend chips and last-point dots.",
      },
      {
        slug: "donut",
        title: "Donut breakdown",
        blurb: "Donut chart with side legend and total in centre.",
      },
      {
        slug: "scatter",
        title: "Scatter plot",
        blurb: "X/Y scatter with quadrant lines and outlier callouts.",
        status: "wip",
      },
      {
        slug: "waterfall",
        title: "Waterfall",
        blurb: "Net-revenue waterfall with positive / negative bars.",
        status: "wip",
      },
    ],
  },
  {
    slug: "timelines",
    title: "Timelines",
    blurb: "Audit trails, changelogs, deploys, status, mentions.",
    Icon: WireframeTimelines,
    designs: [
      {
        slug: "audit",
        title: "Audit trail",
        blurb: "Vertical event rail with actor avatars and JSON diff.",
      },
      {
        slug: "notifications",
        title: "Notifications panel",
        blurb: "Grouped panel with unread filter and clear-all.",
      },
      {
        slug: "changelog",
        title: "Changelog",
        blurb: "Versioned release notes with category tags.",
      },
      {
        slug: "commits",
        title: "Commit history",
        blurb: "Git log with branch graph and commit hashes.",
      },
      {
        slug: "approvals",
        title: "Approvals",
        blurb: "PR approval timeline with reviewer states and CI badges.",
      },
      {
        slug: "pull-request",
        title: "Pull request",
        blurb: "Ship checklist PR — merge readiness hero, inline diff comments, single timeline.",
        status: "wip",
      },
      {
        slug: "pr-ops-console",
        title: "PR ops console",
        blurb: "Mission-control PR view — pipeline DAG, env metrics, merge queue.",
        status: "wip",
      },
      {
        slug: "releases",
        title: "Release timeline",
        blurb: "Stage progression — staging, canary, production.",
        status: "wip",
      },
      {
        slug: "status-page",
        title: "Status page",
        blurb: "Public incident timeline with severity ribbons.",
        status: "wip",
      },
      {
        slug: "deploys",
        title: "Deploy history",
        blurb: "Deploy log with environment badges and roll-back action.",
      },
      {
        slug: "inbox-thread",
        title: "Inbox thread",
        blurb: "Threaded conversation with quoted replies.",
      },
      {
        slug: "activity-feed",
        title: "Activity feed",
        blurb: "Mixed event feed with day separators and avatar stack.",
      },
    ],
  },
  {
    slug: "calendars",
    title: "Calendars",
    blurb: "Month grids, week schedules, agenda lists, heatmaps.",
    Icon: WireframeCalendars,
    designs: [
      {
        slug: "month",
        title: "Month view",
        blurb: "Full month grid with multi-day events and overflow chip.",
      },
      {
        slug: "week",
        title: "Week schedule",
        blurb: "Hour-grid week view with overlapping events.",
      },
      {
        slug: "agenda",
        title: "Agenda list",
        blurb: "Day-grouped event list with travel time gaps.",
      },
      {
        slug: "date-range",
        title: "Date range picker",
        blurb: "Two-month picker with preset shortcuts rail.",
      },
      {
        slug: "timezone",
        title: "Timezone planner",
        blurb: "Stacked timezone bars with overlap window highlighted.",
      },
      {
        slug: "mini",
        title: "Mini calendar",
        blurb: "Compact inline calendar with event dots under days.",
      },
      {
        slug: "year-heatmap",
        title: "Contribution heatmap",
        blurb: "GitHub-style year heatmap with month / weekday axes.",
      },
      {
        slug: "recurring",
        title: "Recurring event",
        blurb: "RRULE editor with weekday picker and end-date options.",
      },
      {
        slug: "holidays",
        title: "Holidays & PTO",
        blurb: "Team-wide PTO calendar with overlap warnings.",
      },
      {
        slug: "calendar-week",
        title: "Calendar Week",
        blurb: "A week calendar you can push around: drag events to move or stretch them on a 15-minute snap, drag empty time to create one, nudge with the arrow keys, and watch the now line creep down the day.",
        status: "new",
      },
    ],
  },
  {
    slug: "profile",
    title: "Profile",
    blurb: "User pages, hover cards, team grids, presence rails.",
    Icon: WireframeProfile,
    designs: [
      {
        slug: "hero",
        title: "Profile hero",
        blurb: "Cover banner, avatar overlap, identity, action row.",
      },
      {
        slug: "hover-card",
        title: "Hover card",
        blurb: "Mention preview with avatar, role, and follow CTA.",
        status: "wip",
      },
      {
        slug: "team-grid",
        title: "Team grid",
        blurb: "Department-grouped grid of teammate cards.",
      },
      {
        slug: "directory",
        title: "Contact directory",
        blurb: "Searchable A–Z member directory with letter rail.",
      },
      {
        slug: "compact-card",
        title: "Compact user card",
        blurb: "Dense list-row card with role, status dot, and menu.",
      },
      {
        slug: "org-chart",
        title: "Org chart",
        blurb: "Tree of reporting lines with collapsed direct-reports.",
        status: "wip",
      },
      {
        slug: "skills",
        title: "Skills matrix",
        blurb: "Tag cloud with proficiency dots and endorsement counts.",
      },
      {
        slug: "presence-rail",
        title: "Presence rail",
        blurb: "Live online-now strip with idle and DND markers.",
        status: "wip",
      },
      {
        slug: "introductions",
        title: "Suggested intros",
        blurb: "People-you-may-know cards with shared-context hints.",
      },
      {
        slug: "credentials",
        title: "Security credentials",
        blurb: "Sessions list with device icons and revoke action.",
      },
      {
        slug: "social-profile",
        title: "Profile",
        blurb: "A social profile with a painted cover, a Follow button that pinches off a notification bell like a droplet, followers that roll up, and posts, replies and a media grid that opens into a lightbox.",
        status: "new",
      },
    ],
  },
  {
    slug: "toasts",
    title: "Toasts & banners",
    blurb: "Ephemeral feedback — confirmation, errors, undos, progress.",
    Icon: WireframeToasts,
    designs: [
      { slug: "success", title: "Success toast", blurb: "Top-right confirmation with check glyph." },
      { slug: "error-retry", title: "Error with retry", blurb: "Failed action with an inline retry button." },
      { slug: "info-banner", title: "System banner", blurb: "Sticky top banner with dismiss." },
      { slug: "progress", title: "Progress toast", blurb: "Upload toast with embedded progress bar." },
      { slug: "undo", title: "Undo toast", blurb: "Snackbar with undo action and timer." },
      { slug: "rich", title: "Rich toast", blurb: "Stacked card toasts with avatar, title, body, actions." },
    ],
  },
  {
    slug: "pricing",
    title: "Pricing",
    blurb: "Tier comparisons, sliders, contact-sales, billing toggles.",
    Icon: WireframePricing,
    designs: [
      { slug: "three-tier", title: "Three-tier", blurb: "Classic three-column plan grid with featured center card." },
      { slug: "comparison-table", title: "Feature matrix", blurb: "Detailed comparison table across plans." },
      { slug: "slider-seats", title: "Seat slider", blurb: "Live-priced slider that updates the total." },
      { slug: "simple-card", title: "Single plan", blurb: "Lone offer card with prominent CTA." },
      { slug: "contact-sales", title: "Contact sales", blurb: "Enterprise card with embedded contact form." },
      { slug: "monthly-yearly", title: "Billing toggle", blurb: "Monthly / yearly toggle with savings badge." },
    ],
  },
  {
    slug: "tours",
    title: "Tours & coachmarks",
    blurb: "Welcome modals, spotlights, beacons, onboarding checklists.",
    Icon: WireframeTours,
    designs: [
      { slug: "welcome-carousel", title: "Welcome carousel", blurb: "Multi-step intro with dot pagination and 'skip'." },
      { slug: "spotlight", title: "Spotlight tour", blurb: "Dim mask with cutout around the target element.", status: "wip" },
      { slug: "arrow-tooltip", title: "Arrow tooltip", blurb: "Tooltip with caret, step counter, and prev/next.", status: "wip" },
      { slug: "beacon", title: "Beacon hint", blurb: "Pulsing dot anchored to a feature with hint card.", status: "wip" },
      { slug: "inline-hint", title: "Inline hint", blurb: "Subtle bottom-right floating hint with dismiss." },
      { slug: "checklist", title: "Onboarding checklist", blurb: "Linear-style task list with progress meter." },
    ],
  },
  {
    slug: "threads",
    title: "Threads & comments",
    blurb: "Inline threads, side panels, reactions, mention popovers.",
    Icon: WireframeThreads,
    designs: [
      { slug: "inline-thread", title: "Inline thread", blurb: "Right-margin thread anchored to a doc paragraph." },
      { slug: "side-panel", title: "Side panel", blurb: "Slide-out conversation pane with participant list." },
      { slug: "comment-row", title: "Comment row", blurb: "Single comment with reactions, replies, more menu." },
      { slug: "mention-popover", title: "@mention popover", blurb: "Typeahead member list under an active mention." },
      { slug: "resolved", title: "Resolved thread", blurb: "Collapsed resolved state with reopen action." },
      { slug: "compose-rich", title: "Rich composer", blurb: "Reply box with formatting toolbar and attach." },
    ],
  },
  {
    slug: "ai",
    title: "AI & Agents",
    blurb: "Assistant home, agent runs, prompt evals, co-writing.",
    Icon: WireframeAI,
    designs: [
      {
        slug: "assistant-start",
        title: "Assistant Start",
        blurb: "The first screen of an AI assistant, with chats and projects down the side, a gooey orb that says hello and a prompt box that gathers tools and connected apps as context, then glides down into the conversation when you send.",
        status: "new",
      },
      {
        slug: "conductor",
        title: "Conductor",
        blurb: "Chat with a lead agent while it works: it streams its replies, hands tasks to helpers whose progress ticks along in a side panel and writes what it learns straight into a launch brief you can edit beside the chat.",
        status: "new",
      },
      {
        slug: "run-replay",
        title: "Run Replay",
        blurb: "Watch an agent work a task from start to finish: plan steps tick off, tool calls stream into a log, it stops to ask before sending anything, and the draft it's writing fills in beside it.",
        status: "new",
      },
      {
        slug: "prompt-test-bench",
        title: "Prompt Test Bench",
        blurb: "Check a prompt before it ships, with pass rate by version against the bar it has to clear, a unified or side-by-side diff of what changed, and test cases that re-run live from queued to a rolling score.",
        status: "new",
      },
      {
        slug: "co-writing-doc",
        title: "Co-writing Doc",
        blurb: "A document where AI agents write alongside you: coloured cursors with name tags glide between words, an agent types its suggestion letter by letter for you to accept or reject, and comments sit in the margin next to the lines they're about.",
        status: "new",
      },
    ],
  },
  {
    slug: "dev-tools",
    title: "Dev tools",
    blurb: "Code review, docs sites, keyboard-driven issue tracking.",
    Icon: WireframeDevTools,
    designs: [
      {
        slug: "code-review",
        title: "Code Review",
        blurb: "A pull request review with a file tree, split or unified diffs with word-level highlights, inline threads you can reply to and resolve, Viewed checkboxes that fold files away, and an approve or request-changes panel.",
        status: "new",
      },
      {
        slug: "docs-site",
        title: "Docs Site",
        blurb: "A documentation site with a top nav, collapsible sidebar, code samples whose language choice follows you across the page, a table of contents that tracks your scroll, ⌘K search over pages and headings, and prev and next cards.",
        status: "new",
      },
      {
        slug: "issue-tracker",
        title: "Issue Tracker",
        blurb: "An issue list you drive with your hands on the keys: J and K to move, S, P, A and L to change status, priority, assignee and labels, X to multi-select, ⌘K for everything else, and rows glide to their new group when they change.",
        status: "new",
      },
    ],
  },
  {
    slug: "apps",
    title: "Apps",
    blurb: "Full product screens: mail, chat, calls, notes, drive, help.",
    Icon: WireframeApps,
    designs: [
      {
        slug: "mail",
        title: "Mail",
        blurb: "A three-pane mail client you can run from the keyboard: J and K walk the threads, E archives with an undo, R drops you into a quick reply, and the reading pane slides over the list on phones.",
        status: "new",
      },
      {
        slug: "team-chat",
        title: "Team Chat",
        blurb: "Channels and DMs with grouped messages, reactions that roll their counts, and threads that open in a side panel; send something and a teammate starts typing back.",
        status: "new",
      },
      {
        slug: "video-call",
        title: "Video Call",
        blurb: "A video call where the grid reflows as people drop in and out, whoever is talking gets a soft ring and a pulse, reactions float up the stage, and chat and people slide in beside it.",
        status: "new",
      },
      {
        slug: "notes",
        title: "Notes",
        blurb: "A notes app with folders, pinned notes that glide to the top, search that highlights matches as you type, and an editor where typing “[] ”, “- ” or “# ” turns a line into a checklist, bullet or heading.",
        status: "new",
      },
      {
        slug: "drive",
        title: "Drive",
        blurb: "A cloud drive home with a sidebar of places and quick access, start-from-template cards, and folders that glide between a card grid and a tidy table when you switch views, with search, sort and stars.",
        status: "new",
      },
      {
        slug: "folder-view",
        title: "Folder View",
        blurb: "One folder opened inside a drive, with a folder tree in the sidebar, type filters with counts, a grid of file cards with little drawn previews or a dense table, a bulk bar that rises with a rolling count when you pick a few, and ghost files fanning out of an empty sub-folder.",
        status: "new",
      },
      {
        slug: "help-centre",
        title: "Help Centre",
        blurb: "A support site with a search that suggests articles as you type, topic cards, readable articles with a table of contents that follows you, and a feedback form that asks what went wrong.",
        status: "new",
      },
    ],
  },
  {
    slug: "personal",
    title: "Personal",
    blurb: "Consumer screens: money, habits, music.",
    Icon: WireframePersonal,
    designs: [
      {
        slug: "money",
        title: "Money",
        blurb: "A personal finance home: the balance rolls digit by digit as you switch accounts or pay a bill, the payment lands in your transactions, spending donut and budgets at once, and each budget shows if you’re spending ahead of pace.",
        status: "new",
      },
      {
        slug: "habits",
        title: "Habits",
        blurb: "A habit tracker that makes ticking things off feel good: checks fill and draw in a beat, counted habits fill like a glass, streaks roll up, and a week grid lets you patch the days you forgot to log.",
        status: "new",
      },
      {
        slug: "music-player",
        title: "Music Player",
        blurb: "A music app with gradient cover art that glows into the room, a waveform you can scrub, a drag-to-reorder queue and lyrics that follow the song line by line.",
        status: "new",
      },
    ],
  },
  {
    slug: "commerce",
    title: "Commerce",
    blurb: "Checkout and live order tracking.",
    Icon: WireframeCommerce,
    designs: [
      {
        slug: "checkout",
        title: "Checkout",
        blurb: "A one-page checkout that folds each finished step into a one-line summary: inline validation that clears as you type, delivery choices that re-total the order, a card that flips when you reach the CVC, and a calm confirmation.",
        status: "new",
      },
      {
        slug: "delivery-tracker",
        title: "Delivery Tracker",
        blurb: "Live order tracking on a hand-drawn city map: the courier rides the route as the ETA counts down, you can zoom in to follow them, message with quick replies, and rate and tip once it lands.",
        status: "new",
      },
    ],
  },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getDesign(
  category: CategorySlug,
  designSlug: string,
): Design | undefined {
  return getCategory(category)?.designs.find((d) => d.slug === designSlug);
}
