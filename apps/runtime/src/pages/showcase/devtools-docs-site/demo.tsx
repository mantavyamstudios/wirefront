// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: sample docs in devl.dev's frame, opened on the retries guide; feedback goes nowhere.
// Not shipped by the registry; builders load their own pages.
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import { DocsSite } from "./view";

export function DevtoolsDocsSiteShowcasePage() {
  return (
    <DevlFrame>
      <DocsSite
        dashboardHref="https://kestrel.example/dashboard"
        editHref={(page) => `https://kestrel.example/docs/edit/${page}.mdx`}
        initialPage="retries"
        languages={fixtures.languages}
        onFeedback={() => {}}
        pages={fixtures.listDocsPages}
        product="Kestrel"
        topNav={fixtures.topNav}
        version="v2.4"
      />
    </DevlFrame>
  );
}
