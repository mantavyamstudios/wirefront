import { useSyncExternalStore } from "react";

const subscribeNever = () => () => {
  // Nothing changes after hydration, so there is nothing to subscribe to.
};

/** False while rendering on the server and during hydration, true after. */
export const useIsClient = (): boolean =>
  useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
