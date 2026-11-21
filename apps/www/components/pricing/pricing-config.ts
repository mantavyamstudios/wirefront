import { SITE_NAME } from "@/lib/site";

/** Mantavyam Studios' booking page (published in the README). */
export const BOOK_A_CALL_URL = "https://cal.com/mantavyam/business";

export const PRICING_CORE_MESSAGE =
  "Try every screen live in your browser and install its full source, free and open source under MIT. Need help wiring screens to your product? Book a call with Mantavyam Studios.";

export const PRICING_DISCLAIMER =
  "Custom work is scoped per project. Book a call to talk it through.";

export interface PricingFaqItem {
  content: string;
  title: string;
}

export const PRICING_FAQ_ITEMS: PricingFaqItem[] = [
  {
    title: `What is ${SITE_NAME}?`,
    content:
      "A library of 200 responsive, ready-to-wire UI screens built on shadcn/ui and Base UI. Preview each one live in the browser, then install it with the shadcn CLI.",
  },
  {
    title: "Is it really free?",
    content:
      "Yes. Every screen is free and open source under the MIT License, with no account needed.",
  },
  {
    title: "Can I use the screens in commercial apps?",
    content:
      "Yes. The MIT License allows personal and commercial use; keep the copyright and license notice with the code.",
  },
  {
    title: "Can you build or wire screens for us?",
    content:
      "Mantavyam Studios takes on custom work. Book a call to talk about your project.",
  },
  {
    title: "How do I install a screen?",
    content:
      "Run the shadcn CLI command on the screen's page, then pass your own data in as props.",
  },
];


