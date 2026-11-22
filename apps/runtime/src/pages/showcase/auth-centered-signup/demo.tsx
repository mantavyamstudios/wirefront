// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the screen with Wirefront's demo logo, providers and links.
// Not shipped by the registry; builders pass their own.
import { CenteredSignUp } from "./view";

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function AuthCenteredSignupShowcasePage() {
  return (
    <CenteredSignUp
      highlights={["Free for 14 days", "No credit card", "Cancel anytime"]}
      logo={<BrandMark />}
      onProvider={() => wait(600)}
      onSignUp={() => wait(800)}
      privacyHref="#privacy"
      providers={[
        { id: "github", name: "GitHub", icon: <GitHubIcon /> },
        { id: "google", name: "Google", icon: <GoogleIcon /> },
      ]}
      signInHref="#sign-in"
      termsHref="#terms"
    />
  );
}

function BrandMark() {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden
      className="size-9"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <rect
        width="64"
        height="64"
        rx="14"
        className="fill-foreground/6"
        stroke="currentColor"
        strokeOpacity="0.12"
      />
      <g transform="translate(32 32) rotate(-25)">
        <path
          d="M -22 0 A 22 8 0 0 1 22 0"
          stroke="currentColor"
          strokeOpacity="0.45"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
      </g>
      <circle cx="32" cy="32" r="11" className="fill-foreground" />
      <g transform="translate(32 32) rotate(-25)">
        <path
          d="M 22 0 A 22 8 0 0 1 -22 0"
          stroke="currentColor"
          strokeOpacity="0.85"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="currentColor">
      <path d="M12 .5C5.7.5.6 5.6.6 11.9c0 5 3.3 9.3 7.8 10.8.6.1.8-.2.8-.5v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.5-.3-5.2-1.3-5.2-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.2 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5 4.5-1.5 7.8-5.8 7.8-10.8C23.4 5.6 18.3.5 12 .5Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path
        fill="#EA4335"
        d="M12 5c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.5 15 .5 12 .5 7.3.5 3.3 3.2 1.4 7.1l3.8 3c.9-2.8 3.5-4.6 6.8-4.6Z"
      />
      <path
        fill="#34A853"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.7-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.6Z"
      />
      <path
        fill="#FBBC05"
        d="M5.2 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1l-3.8-3C.5 8.7 0 10.3 0 12s.5 3.3 1.4 4.7l3.8-2.6Z"
      />
      <path
        fill="#4285F4"
        d="M12 23.5c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.3 0-6-2-6.9-4.6l-3.8 3C3.3 20.8 7.3 23.5 12 23.5Z"
      />
    </svg>
  );
}
