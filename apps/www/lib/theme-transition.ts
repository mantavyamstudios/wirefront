/** The theme is applied before the animation runs, so a skipped or interrupted animation only gets logged. */
const reportUnfinished = async (finished: Promise<void>) => {
  try {
    await finished;
  } catch (error) {
    console.warn("[theme] the theme transition animation didn't finish", error);
  }
};
export type ThemeMode = "dark" | "light" | "system";

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransition;
};

let themeTransitionTimer: number | undefined;

const resolveTheme = (theme: ThemeMode): "dark" | "light" => {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
};

const applyThemeToDom = (theme: ThemeMode): void => {
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.classList.toggle("light", resolved === "light");
  document.documentElement.style.colorScheme = resolved;
};

export const setThemeWithTransition = (
  setTheme: (theme: ThemeMode) => void,
  theme: ThemeMode
): void => {
  if (typeof window === "undefined") {
    setTheme(theme);
    return;
  }

  const doc = document as DocumentWithViewTransition;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion || !doc.startViewTransition) {
    if (!prefersReducedMotion) {
      const executeThemeChange = () => {
        applyThemeToDom(theme);
        setTheme(theme);

        if (themeTransitionTimer !== undefined) {
          window.clearTimeout(themeTransitionTimer);
        }
        themeTransitionTimer = window.setTimeout(() => {
          document.documentElement.classList.remove("theme-transitioning");
          themeTransitionTimer = undefined;
        }, 350);
      };

      if (!document.documentElement.classList.contains("theme-transitioning")) {
        document.documentElement.classList.add("theme-transitioning");
      }
      executeThemeChange();
      return;
    }

    applyThemeToDom(theme);
    setTheme(theme);
    return;
  }

  const transition = doc.startViewTransition(() => {
    applyThemeToDom(theme);
    setTheme(theme);
  });
  reportUnfinished(transition.finished);
};
