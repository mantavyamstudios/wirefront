import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";

export default defineConfig({
  env: core.env,
  extends: [core, react, next],
  overrides: [
    {
      // shadcn's Field and InputGroup use role="group" on a div, as upstream
      // does; a <fieldset> around a single field is the wrong semantics.
      // Approved by the owner.
      files: [
        "src/components/ui/field.tsx",
        "src/components/ui/input-group.tsx",
      ],
      rules: { "jsx-a11y/prefer-tag-over-role": "off" },
    },
  ],
});
