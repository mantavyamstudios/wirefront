// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { HelpArticle, HelpBlock, HelpCategory } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const listCategories: HelpCategory[] = [
  {
    id: "start",
    name: "Getting started",
    description: "Set up your workspace and send your first invoice.",
    icon: "rocket",
    tone: "sky",
  },
  {
    id: "payments",
    name: "Payments & payouts",
    description:
      "Get paid by card or bank transfer, and know when money lands.",
    icon: "payments",
    tone: "emerald",
  },
  {
    id: "invoices",
    name: "Invoices & quotes",
    description: "Templates, reminders, taxes and credit notes.",
    icon: "invoices",
    tone: "amber",
  },
  {
    id: "billing",
    name: "Plans & billing",
    description: "Change plan, update your card, download receipts.",
    icon: "billing",
    tone: "violet",
  },
  {
    id: "security",
    name: "Account & security",
    description: "Two-factor, passkeys, sessions and data exports.",
    icon: "security",
    tone: "rose",
  },
  {
    id: "integrations",
    name: "Integrations",
    description: "Connect accounting tools and bank feeds.",
    icon: "integrations",
    tone: "teal",
  },
];

const brief = (
  intro: string,
  heading: string,
  steps: string[],
  tail?: string
): HelpBlock[] => [
  { type: "p", text: intro },
  { type: "h2", text: heading },
  { type: "steps", items: steps },
  ...(tail ? [{ type: "p", text: tail } as HelpBlock] : []),
];

export const listArticles: HelpArticle[] = [
  {
    id: "payout-timing",
    title: "How long do payouts take?",
    categoryId: "payments",
    summary:
      "Most payouts reach your bank in 2 business days. Timing depends on the payment method and your bank.",
    updatedAt: "2026-10-12",
    minutes: 3,
    popular: true,
    body: [
      {
        type: "p",
        text: "Most payouts reach your bank in 2 business days. The exact timing depends on how your customer paid and where your bank is.",
      },
      { type: "h2", text: "Payout timing by method" },
      {
        type: "list",
        items: [
          "Card payments: 2 business days after the payment clears.",
          "Bank transfers (ACH or SEPA): 3 to 4 business days.",
          "Instant payouts: within 30 minutes, for a 1% fee.",
        ],
      },
      {
        type: "callout",
        tone: "info",
        text: "Payouts don't move on weekends or bank holidays. A payment made on Friday evening usually lands on Tuesday.",
      },
      { type: "h2", text: "Check when a payout will arrive" },
      {
        type: "steps",
        items: [
          "Open Payments in the sidebar.",
          "Select the Payouts tab.",
          "Find the payout and check the Expected column. Hover the date to see which payments it includes.",
        ],
      },
      { type: "h2", text: "If a payout is late" },
      {
        type: "p",
        text: "If a payout hasn't arrived 2 business days after its expected date, check your bank details under Settings → Payouts, then contact us with the payout ID. It starts with po_.",
      },
    ],
  },
  {
    id: "two-factor",
    title: "Set up two-factor authentication",
    categoryId: "security",
    summary:
      "Add a second step at sign-in so a stolen password alone can't open your account.",
    updatedAt: "2026-09-28",
    minutes: 2,
    popular: true,
    body: [
      {
        type: "p",
        text: "Two-factor authentication (2FA) asks for a second step when you sign in, so a stolen password alone can't get into your account.",
      },
      { type: "h2", text: "Turn on 2FA" },
      {
        type: "steps",
        items: [
          "Go to Settings → Security.",
          "Under Two-factor authentication, choose Authenticator app.",
          "Scan the QR code with your app and enter the 6-digit code it shows.",
          "Save your backup codes somewhere safe. Each one works once.",
        ],
      },
      {
        type: "callout",
        tone: "warning",
        text: "If you lose your phone and your backup codes, we have to verify your identity before restoring access. That can take up to 3 business days.",
      },
      { type: "h2", text: "Require 2FA for your team" },
      {
        type: "p",
        text: "Owners and admins can make 2FA mandatory under Settings → Team → Security policy. Teammates without it are asked to set it up the next time they sign in.",
      },
    ],
  },
  {
    id: "reminders",
    title: "Send automatic payment reminders",
    categoryId: "invoices",
    summary:
      "Choose when reminders go out before and after the due date, and what they say.",
    updatedAt: "2026-10-03",
    minutes: 2,
    popular: true,
    body: [
      {
        type: "p",
        text: "Reminders go out on a schedule you choose, so you don't have to chase late invoices yourself.",
      },
      { type: "h2", text: "Set a reminder schedule" },
      {
        type: "steps",
        items: [
          "Open Invoices → Settings → Reminders.",
          "Pick when reminders go out: before the due date, on it, and after it.",
          "Edit the message for each reminder, or keep the default wording.",
          "Click Save. The schedule applies to every new invoice.",
        ],
      },
      { type: "h2", text: "Turn reminders off for one customer" },
      {
        type: "p",
        text: "Open the customer, choose Edit, and switch off Send payment reminders. Invoices already sent keep their schedule until you pause them.",
      },
      {
        type: "callout",
        tone: "info",
        text: "Reminders stop automatically as soon as an invoice is paid in full.",
      },
    ],
  },
  {
    id: "declined",
    title: "Why was a payment declined?",
    categoryId: "payments",
    summary:
      "The customer's bank made the call. Here's what each decline reason means and how to retry.",
    updatedAt: "2026-10-18",
    minutes: 3,
    popular: true,
    body: [
      {
        type: "p",
        text: "When a card payment is declined, the customer's bank made the call. We show the reason the bank gave on the payment's timeline.",
      },
      { type: "h2", text: "Common reasons" },
      {
        type: "list",
        items: [
          "Insufficient funds: the customer should try another card or pay by bank transfer.",
          "Do not honour: a generic refusal. The customer needs to call their bank.",
          "Suspected fraud: the bank flagged it. Ask the customer to approve the charge in their banking app, then retry.",
        ],
      },
      { type: "h2", text: "Retry a declined payment" },
      {
        type: "steps",
        items: [
          "Open the invoice.",
          "Click Send payment link to email the customer a fresh link.",
          "Or, if they asked you to, choose Retry card to charge the saved card again.",
        ],
      },
      {
        type: "callout",
        tone: "warning",
        text: "Retrying the same card more than 3 times in 24 hours can get it blocked. Ask the customer first.",
      },
    ],
  },
  {
    id: "change-plan",
    title: "Change or cancel your plan",
    categoryId: "billing",
    summary:
      "Upgrades apply right away. Downgrades and cancellations take effect at the end of your billing period.",
    updatedAt: "2026-08-30",
    minutes: 2,
    popular: true,
    body: brief(
      "Upgrades apply right away and you're charged the difference for the rest of the period. Downgrades and cancellations take effect when the current period ends.",
      "Change your plan",
      [
        "Go to Settings → Plan & billing.",
        "Click Change plan and pick the new plan.",
        "Review the price change, then confirm.",
      ],
      "Cancelling keeps your data for 90 days, so you can come back without losing invoices or customers."
    ),
  },
  {
    id: "invite-accountant",
    title: "Invite your accountant",
    categoryId: "start",
    summary:
      "Give your accountant read-only access to invoices, payouts and reports. It doesn't use a paid seat.",
    updatedAt: "2026-09-09",
    minutes: 1,
    popular: true,
    body: brief(
      "Accountants get read-only access to invoices, payouts and reports. The Accountant role is free and doesn't count towards your seats.",
      "Send the invite",
      [
        "Open Settings → Team.",
        "Click Invite and enter their email.",
        "Choose the Accountant role and send.",
      ]
    ),
  },
  {
    id: "first-invoice",
    title: "Create your first invoice",
    categoryId: "start",
    summary:
      "Add a customer, line items and a due date, then send it by email or share a link.",
    updatedAt: "2026-07-22",
    minutes: 3,
    body: brief(
      "An invoice needs a customer, at least one line item and a due date. Everything else is optional.",
      "Create and send",
      [
        "Click New → Invoice.",
        "Pick a customer or add a new one.",
        "Add line items, then set the due date.",
        "Click Send, or Copy link to share it yourself.",
      ]
    ),
  },
  {
    id: "vat",
    title: "Add VAT or sales tax to invoices",
    categoryId: "invoices",
    summary:
      "Save tax rates once and apply them per line item. Totals and tax summaries update automatically.",
    updatedAt: "2026-10-01",
    minutes: 2,
    body: brief(
      "Save each tax rate once, then apply it to any line item. Invoice totals and the tax summary update as you go.",
      "Add a tax rate",
      [
        "Go to Invoices → Settings → Taxes.",
        "Click Add rate, name it (for example “VAT 20%”) and enter the percentage.",
        "On any invoice, pick the rate from the Tax column.",
      ]
    ),
  },
  {
    id: "bank-feed",
    title: "Connect a bank feed",
    categoryId: "integrations",
    summary:
      "Match incoming payments to invoices automatically by connecting your business bank account.",
    updatedAt: "2026-09-17",
    minutes: 2,
    body: brief(
      "A bank feed brings in transactions every few hours so we can match them to open invoices for you.",
      "Connect your bank",
      [
        "Open Integrations → Bank feeds.",
        "Search for your bank and sign in through its secure page.",
        "Pick the accounts to sync. The first import covers 90 days.",
      ]
    ),
  },
  {
    id: "receipts",
    title: "Download receipts and tax invoices",
    categoryId: "billing",
    summary:
      "Every charge has a PDF receipt. You can also add your tax ID so it appears on them.",
    updatedAt: "2026-08-04",
    minutes: 1,
    body: brief(
      "Every charge for your plan has a receipt you can download as a PDF.",
      "Find a receipt",
      [
        "Go to Settings → Plan & billing.",
        "Scroll to Billing history.",
        "Click Download next to the charge.",
      ],
      "To show your tax ID on receipts, add it under Billing details. It applies to future receipts only."
    ),
  },
  {
    id: "passkey",
    title: "Sign in with a passkey",
    categoryId: "security",
    summary: "Use your fingerprint, face or device PIN instead of a password.",
    updatedAt: "2026-10-20",
    minutes: 1,
    body: brief(
      "Passkeys let you sign in with your fingerprint, face or device PIN. They can't be phished or reused.",
      "Add a passkey",
      [
        "Go to Settings → Security.",
        "Under Passkeys, click Add passkey.",
        "Follow your device's prompt to confirm.",
      ]
    ),
  },
  {
    id: "accounting-sync",
    title: "Sync invoices to your accounting software",
    categoryId: "integrations",
    summary: "Invoices, payments and fees sync both ways, every 15 minutes.",
    updatedAt: "2026-09-25",
    minutes: 3,
    body: brief(
      "Once connected, invoices, payments and fees sync both ways every 15 minutes.",
      "Turn on sync",
      [
        "Open Integrations and choose your accounting tool.",
        "Sign in and approve access.",
        "Map your income and fee accounts, then click Start syncing.",
      ]
    ),
  },
  {
    id: "refund",
    title: "Issue a refund or credit note",
    categoryId: "invoices",
    summary:
      "Refund all or part of a payment. A credit note is created for your records automatically.",
    updatedAt: "2026-10-09",
    minutes: 2,
    body: brief(
      "You can refund all or part of a card payment. We create a matching credit note so your books stay balanced.",
      "Refund a payment",
      [
        "Open the paid invoice.",
        "Click Refund and enter the amount.",
        "Add a reason (the customer sees it) and confirm.",
      ],
      "Refunds take 5 to 10 business days to reach the customer's card."
    ),
  },
  {
    id: "payout-account",
    title: "Update your payout bank account",
    categoryId: "payments",
    summary:
      "Change where payouts go. Pending payouts still go to the old account.",
    updatedAt: "2026-09-02",
    minutes: 1,
    body: brief(
      "You can change the bank account payouts go to at any time. Payouts already on their way still go to the old account.",
      "Change the account",
      [
        "Go to Settings → Payouts.",
        "Click Change next to your bank account.",
        "Enter the new details and confirm with your 2FA code.",
      ]
    ),
  },
];
export const popularSearches = [
  "payouts",
  "2FA",
  "refund",
  "VAT",
  "cancel plan",
];
export const feedbackReasons = [
  "Out of date",
  "Hard to follow",
  "Didn’t fix my problem",
  "Something else",
];
export const contactSupport = { ticket: "48213" };
