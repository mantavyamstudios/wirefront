import {
  CONTACT_EMAIL,
  GITHUB_PROFILE_URL,
  GITHUB_REPO_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  X_PROFILE_URL,
} from "@/lib/site";

export const PUBLISHER_JSON_LD = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  email: CONTACT_EMAIL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/brand/avatar-192.jpg`,
    caption: `${SITE_NAME} logo`,
    width: 192,
    height: 192,
  },
  sameAs: [GITHUB_REPO_URL],
  slogan: "Real Flutter flows, live in your browser",
  knowsAbout: ["Flutter", "Dart", "Mobile UI", "User flows", "UI design"],
  founder: {
    "@type": "Person",
    name: "Devesh Mishra",
    sameAs: [GITHUB_PROFILE_URL, X_PROFILE_URL],
  },
} as const;

export const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: "en",
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
    PUBLISHER_JSON_LD,
  ],
};
