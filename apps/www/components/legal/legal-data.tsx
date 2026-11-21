import Link from "@/components/site-link";
import { COMMUNITY_ISSUES_URL, CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

import type { TermItem } from "./legal-scroll-view";

function ContactLine({ topic }: { topic: string }) {
  return (
    <p className="lg:text-lg">
      Questions about {topic} can go to{" "}
      <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, or open an issue
      on{" "}
      <a href={COMMUNITY_ISSUES_URL} rel="noopener noreferrer" target="_blank">
        GitHub
      </a>
      .
    </p>
  );
}

export const TERMS_OF_SERVICE_ITEMS: TermItem[] = [
  {
    id: "using-the-flows",
    title: "1. Using the flows",
    content: (
      <>
        <p className="lg:text-lg">
          These terms cover your use of the {SITE_NAME} website and the Flutter
          flows it shows. By using the site, you agree to them.
        </p>
        <p className="lg:text-lg">
          The flows are provided as reference implementations. You are free to
          run them in the browser and study how they work.
        </p>
        <p className="lg:text-lg">
          Please don&apos;t disrupt the site, try to gain unauthorized access to
          it, or overload it with automated traffic.
        </p>
      </>
    ),
  },
  {
    id: "license",
    title: "2. License",
    content: (
      <>
        <p className="lg:text-lg">
          Free flows may be used in personal and commercial projects. Plus flows
          are covered by the Plus license. Redistributing the flow library as-is
          is not permitted.
        </p>
        <p className="lg:text-lg">
          See the <Link href="/docs/license">License</Link> page for the full
          terms and third-party attributions.
        </p>
      </>
    ),
  },
  {
    id: "no-warranty",
    title: "3. No warranty",
    content: (
      <p className="lg:text-lg">
        The flows and site are provided &ldquo;as is&rdquo;, without warranty of
        any kind. Use in production is at your own discretion.
      </p>
    ),
  },
  {
    id: "privacy",
    title: "4. Privacy",
    content: (
      <p className="lg:text-lg">
        How the site handles data is described in the{" "}
        <Link href="/legal/privacy">Privacy Policy</Link>.
      </p>
    ),
  },
  {
    id: "changes",
    title: "5. Changes",
    content: (
      <p className="lg:text-lg">
        These terms may change as the project grows; the latest version always
        lives on this page.
      </p>
    ),
  },
  {
    id: "contact",
    title: "6. Contact",
    content: <ContactLine topic="these terms" />,
  },
];

export const PRIVACY_POLICY_ITEMS: TermItem[] = [
  {
    id: "what-we-collect",
    title: "1. What we collect",
    content: (
      <>
        <p className="lg:text-lg">
          The site is a static web app. It does not require an account and does
          not ask for personal information.
        </p>
        <p className="lg:text-lg">
          Basic, aggregated analytics from Cloudflare Web Analytics may be used
          to understand which flows are popular. It does not use cookies or
          build a profile of you.
        </p>
      </>
    ),
  },
  {
    id: "what-we-do-not-do",
    title: "2. What we do not do",
    content: (
      <p className="lg:text-lg">
        No selling of data, no advertising trackers, no cross-site profiles. The
        device preview runs entirely in your browser.
      </p>
    ),
  },
  {
    id: "device-features",
    title: "3. Camera, microphone and location",
    content: (
      <p className="lg:text-lg">
        Some flows demonstrate taking photos, recording, scanning or maps. They
        only use your camera, microphone or location after your browser asks for
        and receives your permission, and you can revoke it at any time in your
        browser settings.
      </p>
    ),
  },
  {
    id: "services-we-use",
    title: "4. Services we use",
    content: (
      <>
        <p className="lg:text-lg">
          The site is hosted on Cloudflare Pages, which processes standard
          request data (such as your IP address) to serve and protect it.
        </p>
        <p className="lg:text-lg">
          Some flows load content from third parties while you use them: maps
          from Google Maps, fonts from Google Fonts and sample photos from
          Unsplash. Those services receive standard request data under their own
          privacy policies.
        </p>
      </>
    ),
  },
  {
    id: "your-choices",
    title: "5. Your choices",
    content: (
      <p className="lg:text-lg">
        You can block analytics with any standard content blocker without
        affecting how the flows work.
      </p>
    ),
  },
  {
    id: "changes",
    title: "6. Changes to this policy",
    content: (
      <p className="lg:text-lg">
        This policy may change as the project grows; the latest version always
        lives on this page.
      </p>
    ),
  },
  {
    id: "contact",
    title: "7. Contact",
    content: <ContactLine topic="privacy" />,
  },
];
