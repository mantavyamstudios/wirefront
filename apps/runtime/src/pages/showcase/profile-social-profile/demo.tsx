// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: the profile in devl.dev's frame with a fixed clock; changes save nowhere.
// Not shipped by the registry; builders wire SocialProfile to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import { SocialProfile } from "./view";

const demoNow = () => new Date(fixtures.now);
const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
const save = () => wait(250);

export function ProfileSocialProfileShowcasePage() {
  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <DevlFrame>
        <SocialProfile
          copyright={fixtures.copyright}
          footerLinks={fixtures.footerLinks}
          media={fixtures.listMedia}
          mutuals={fixtures.mutuals}
          onFollowSuggestion={save}
          onReact={save}
          onToggleFollow={save}
          onToggleMute={save}
          onToggleNotify={save}
          postUrl={(id) =>
            `https://ripple.example/${fixtures.getSocialProfile.handle}/${id}`
          }
          posts={fixtures.listPosts}
          profileUrl={`https://ripple.example/@${fixtures.getSocialProfile.handle}`}
          replies={fixtures.listReplies}
          streak={fixtures.streak}
          suggestions={fixtures.listSuggestions}
          user={fixtures.getSocialProfile}
        />
      </DevlFrame>
    </WirefrontProvider>
  );
}
