"use client";

import type { ReactNode } from "react";
import { useLayoutEffect, useSyncExternalStore } from "react";

export interface HeaderTocItem {
  depth: number;
  title: ReactNode;
  url: string;
}

const EMPTY_ITEMS: HeaderTocItem[] = [];
/** Short gap while the next page's publisher mounts (blog headings included). */
const UNPUBLISH_MS = 50;

let items: HeaderTocItem[] = EMPTY_ITEMS;
let epoch = 0;
let unpublishTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) {
    listener();
  }
};

const sameItems = (left: HeaderTocItem[], right: HeaderTocItem[]) => {
  if (left === right) {
    return true;
  }
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index];
    const b = right[index];
    if (
      !(a && b) ||
      a.url !== b.url ||
      a.depth !== b.depth ||
      a.title !== b.title
    ) {
      return false;
    }
  }
  return true;
};

export const publishHeaderToc = (nextItems: HeaderTocItem[]) => {
  epoch += 1;
  if (unpublishTimer) {
    clearTimeout(unpublishTimer);
    unpublishTimer = null;
  }
  const resolved = nextItems.length > 0 ? nextItems : EMPTY_ITEMS;
  if (sameItems(items, resolved)) {
    return;
  }
  items = resolved;
  emit();
};

export const unpublishHeaderToc = () => {
  const epochAtUnmount = epoch;
  if (unpublishTimer) {
    clearTimeout(unpublishTimer);
  }
  unpublishTimer = setTimeout(() => {
    unpublishTimer = null;
    if (epoch !== epochAtUnmount) {
      return;
    }
    items = EMPTY_ITEMS;
    emit();
  }, UNPUBLISH_MS);
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => items;

const getServerSnapshot = () => EMPTY_ITEMS;

export const useHeaderTocItems = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

/** Page-level publisher. Nav owns the visible chrome so route changes do not remount it. */
export const usePublishHeaderToc = (
  nextItems: HeaderTocItem[],
  skipEmpty = false
) => {
  useLayoutEffect(() => {
    if (skipEmpty && nextItems.length === 0) {
      return;
    }
    publishHeaderToc(nextItems);
    return () => {
      unpublishHeaderToc();
    };
  }, [nextItems, skipEmpty]);
};
