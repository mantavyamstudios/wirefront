import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const PRICING_CORE_MESSAGE =
  "Try every flow live in your browser and read its full Dart source, free. Plus, with a commercial license and new flows as they land, is coming soon.";

export const PRICING_DISCLAIMER =
  "Plus pricing isn't final yet. Get in touch to hear when it launches or to talk about commercial use.";

export interface PricingFaqItem {
  content: string;
  title: string;
}

export const PRICING_FAQ_ITEMS: PricingFaqItem[] = [
  {
    title: `What is ${SITE_NAME}?`,
    content:
      "A library of Flutter UI flows you can preview live in the browser, with the full Dart source of every screen.",
  },
  {
    title: "Is it really free?",
    content:
      "Yes. Previewing every flow and reading its source is free, with no account needed.",
  },
  {
    title: "Can I use the flows in commercial apps?",
    content:
      "See the License page for the current terms, or get in touch to talk about commercial use.",
  },
  {
    title: "What's included in Plus?",
    content:
      "Every flow, new flows as they land, and a commercial license. Pricing is coming soon.",
  },
  {
    title: "How do I use a flow?",
    content:
      "Open the flow's Code tab, copy its Dart files into your Flutter app and adapt them.",
  },
];

export function getSupportMailtoUrl(): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${SITE_NAME} Plus`)}`;
}
