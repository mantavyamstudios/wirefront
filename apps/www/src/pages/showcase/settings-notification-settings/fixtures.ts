// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { NotificationPreferences, NotificationSettingsData } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const product = "Ridgeline";

const defaults: NotificationPreferences = {
  channels: { desktop: "off", mobile: "all", email: "all", chat: "mentions" },
  sections: [
    {
      id: "activity",
      label: "Activity",
      description: "Conversations and work that involves you.",
      enabled: true,
      events: [
        { id: "mentions", label: "Mentions", hint: "Someone @mentions you in a doc or comment.", media: ["email", "push", "chat"], pending: 3, mention: true },
        { id: "replies", label: "Replies", hint: "New replies on threads you started.", media: ["email", "push"], pending: 5 },
        { id: "assigned", label: "Assigned to you", hint: "A task lands on your plate.", media: ["email", "push"], pending: 2 },
      ],
    },
    {
      id: "projects",
      label: "Projects",
      description: "Changes to projects you lead or follow.",
      enabled: true,
      events: [
        { id: "status", label: "Status changes", hint: "A task you follow moves to another column.", media: ["chat"], pending: 9 },
        { id: "due", label: "Due soon", hint: "A day before something of yours is due.", media: ["email", "push"], pending: 1 },
        { id: "created", label: "New projects", hint: "A project is created in one of your teams.", media: [], pending: 2 },
      ],
    },
    {
      id: "billing",
      label: "Billing",
      description: "Invoices and plan limits for the Ridgeline workspace.",
      enabled: true,
      events: [
        { id: "invoice", label: "Invoices", hint: "A new invoice is ready to download.", media: ["email"], pending: 1 },
        { id: "failed", label: "Payment failed", hint: "A card is declined or about to expire.", media: ["email", "push"], pending: 0 },
        { id: "usage", label: "Usage over 80%", hint: "Seats or storage close to your plan limit.", media: ["email"], pending: 1 },
      ],
    },
  ],
  quietHours: { enabled: true, from: 22, to: 8 },
  digest: "weekly",
};

/** What the mocks return for `getNotificationSettings`. */
export const getNotificationSettings: NotificationSettingsData = {
  preferences: defaults,
  defaults,
  channelDetails: {
    desktop: "Banners from the Ridgeline desktop app and this browser.",
    mobile: "Push notifications on Pixel 9.",
    email: "Sent to ada@ridgeline.app.",
    chat: "Direct messages from the Ridgeline bot in your team chat.",
  },
  nextDigestAt: "2026-04-27T09:00:00.000Z",
};
