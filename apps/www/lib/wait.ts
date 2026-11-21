/** Resolves after `ms` milliseconds. */
export const wait = (ms: number): Promise<void> => {
  const { promise, resolve } = Promise.withResolvers<undefined>();
  setTimeout(resolve, ms);
  return promise;
};

/** Resolves after the browser has painted the next frame (two animation frames). */
export const nextPaint = (): Promise<void> => {
  const { promise, resolve } = Promise.withResolvers<undefined>();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
  return promise;
};
