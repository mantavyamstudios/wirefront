// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

interface ScreenRuntimePreviewProps {
  kind: string;
  screen: string;
  title: string;
}

/**
 * A screen running in the Wirefront runtime, for docs pages
 * (`<ComponentPreview name="pricing-three-tier" />`). The screens are a
 * separate app, so docs embed them the way the screen pages do: an iframe on
 * `/preview/<kind>/<screen>`.
 */
export function ScreenRuntimePreview({ kind, screen, title }: ScreenRuntimePreviewProps) {
  return (
    <iframe
      className="block h-[560px] w-full border-0"
      loading="lazy"
      src={`${process.env.NEXT_PUBLIC_RUNTIME_ORIGIN ?? ""}/preview/${kind}/${screen}`}
      title={`${title} preview`}
    />
  );
}
