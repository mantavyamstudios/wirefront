"use client";

import { useCallback, useState } from "react";

interface CommonControlledStateProps<T> {
  defaultValue?: T;
  value?: T;
}

export const useControlledState = <T, Rest extends unknown[] = []>(
  props: CommonControlledStateProps<T> & {
    onChange?: (value: T, ...args: Rest) => void;
  }
): readonly [T, (next: T, ...args: Rest) => void] => {
  const { value, defaultValue, onChange } = props;

  const [internalState, setInternalState] = useState<T>(
    value === undefined ? (defaultValue as T) : value
  );
  // Controlled when `value` is given; the internal state is used otherwise.
  const state = value === undefined ? internalState : value;

  const setState = useCallback(
    (next: T, ...args: Rest) => {
      setInternalState(next);
      onChange?.(next, ...args);
    },
    [onChange]
  );

  return [state, setState] as const;
};
