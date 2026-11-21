import { SITE_NAME } from "@/lib/site";

/** Where sponsors support Wirefront (Razorpay). */
export const SPONSORS_URL = "https://razorpay.me/@mantavyam";

export const PRICING_CORE_MESSAGE =
  "Every screen, with its full source, free and open source under MIT. Install it with the shadcn CLI, wire it to your backend and make it your own.";

export const PRICING_DISCLAIMER =
  "Sponsoring is optional. Every screen stays free and MIT licensed for everyone, sponsor or not.";

export interface PricingFaqItem {
  content: string;
  title: string;
}

export const PRICING_FAQ_ITEMS: PricingFaqItem[] = [
  {
    title: `What is ${SITE_NAME}?`,
    content:
      "A backend-agnostic catalogue of production-grade UI screens, organised by the experience they serve and built to be adaptive, dynamic and responsive. Install any screen with the shadcn CLI and wire it to your own backend.",
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
    title: "How can I support Wirefront?",
    content:
      "Become a sponsor through Razorpay. Sponsors help prioritise upcoming screens and talk directly with the maintainer, and every sponsorship keeps Wirefront free for everyone.",
  },
  {
    title: "How do I install a screen?",
    content:
      "Run the shadcn CLI command on the screen's page. The screen lands in your project as source you own: pass your data in as props, connect its actions to your backend and tweak anything you like.",
  },
];


