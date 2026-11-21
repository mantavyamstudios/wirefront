// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background px-6 text-center font-mono text-foreground">
      <div className="text-[11px] text-muted-foreground uppercase tracking-[0.3em]">
        404
      </div>
      <h1 className="font-heading text-2xl">Nothing here.</h1>
      <p className="max-w-md text-muted-foreground text-sm">
        The page you're looking for doesn't exist in this scratch pad.
      </p>
      <a
        href="/"
        target="_top"
        className="mt-3 text-[11px] text-foreground uppercase tracking-[0.2em] underline-offset-4 hover:underline"
      >
        ← Back to Wirefront
      </a>
    </div>
  );
}
