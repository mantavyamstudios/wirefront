import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";

export default defineConfig({
  env: core.env,
  extends: [core, react, next],
  ignorePatterns: [
    ...(core.ignorePatterns ?? []),
    ".next/**",
    "out/**",
    ".source/**",
    "public/**",
    "__registry__/**",
  ],
  overrides: [
    {
      // The runtime preview iframes keep a sandbox (no top navigation) but need
      // both allow-scripts and allow-same-origin: the runtime is served from its
      // own origin and uses storage and the bridge's origin check. Off for these
      // two files only, approved by the owner.
      files: [
        "components/screens/screen-runtime-preview.tsx",
        "components/screens/screens-runtime-frame.tsx",
      ],
      rules: { "react/iframe-missing-sandbox": "off" },
    },
    {
      // Composition primitives: Tabs reads its panes to place them, Highlight
      // wraps its items and supports asChild. Rewriting these would change the
      // public API of installable registry items. Approved by the owner.
      files: [
        "registry/primitives/animate/tabs/index.tsx",
        "registry/primitives/effects/highlight/index.tsx",
      ],
      rules: {
        "react/no-clone-element": "off",
        "react/no-react-children": "off",
      },
    },
    {
      // Kept as role="dialog": a native <dialog> would change its exit
      // animation and stacking. Approved by the owner.
      files: ["components/blocks/blocks-sidebar.tsx"],
      rules: { "jsx-a11y/prefer-tag-over-role": "off" },
    },
  ],
});
