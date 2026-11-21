"use client";

import { usePathname } from "next/navigation";

/** Cover leftover taps on the header hamburger after a nav close. */
export const MOBILE_SIDEBAR_CLOSE_LOCK_MS = 500;

let closeLocked = false;
let closeLockTimer: number | ReturnType<typeof setTimeout> | null = null;
let suppressUntilExplicitOpen = false;
let lastPathname: string | null = null;

const armCloseLock = () => {
  closeLocked = true;
  if (typeof window === "undefined") {
    return;
  }
  if (closeLockTimer !== null) {
    window.clearTimeout(closeLockTimer);
  }
  closeLockTimer = window.setTimeout(() => {
    closeLocked = false;
    closeLockTimer = null;
  }, MOBILE_SIDEBAR_CLOSE_LOCK_MS);
};

/** Ignore hamburger re-opens from click-through after the drawer starts closing. */
export const markMobileSidebarClosed = () => {
  suppressUntilExplicitOpen = true;
  armCloseLock();
};

export const allowMobileSidebarOpen = () => {
  suppressUntilExplicitOpen = false;
};

export const isMobileSidebarCloseLocked = () => closeLocked;

/**
 * Fumadocs `useOnChange(pathname)` still renders children once with `open`
 * true. Keep the panel visually closed across that frame and across layout
 * remounts until the user opens the hamburger again.
 */
export const isMobileSidebarSuppressed = () => suppressUntilExplicitOpen;

export const closeMobileSidebar = (setOpen: (open: boolean) => void) => {
  markMobileSidebarClosed();
  setOpen(false);
};

/** Records a navigation in the module's sidebar state: after one, the sidebar stays shut until opened on purpose. */
const notePathname = (pathname: string) => {
  if (lastPathname === pathname) {
    return;
  }
  if (lastPathname !== null) {
    suppressUntilExplicitOpen = true;
  }
  lastPathname = pathname;
};

export const useSyncMobileSidebarPathname = () => {
  notePathname(usePathname());
};
