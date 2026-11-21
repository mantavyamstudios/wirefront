/** Starts loading the command palette dialog's code before it is opened. */
export const preloadCommandPaletteDialog = async () => {
  try {
    await import("./command-palette-dialog");
  } catch (error) {
    console.warn(
      "[command palette] couldn't preload the dialog; it loads when opened instead",
      error
    );
  }
};
