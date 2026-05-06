"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Systeme de themes (dark / light).
 * - `dark` = cendré bleuté, surfaces stratifiées, accent glacier
 * - `light` = papier gris chaud, cuivre, accent secondaire froid discret
 *
 * Le provider :
 *   1. Lit la preference en localStorage (cle : STORAGE_KEY)
 *   2. Fallback sur la preference systeme (prefers-color-scheme)
 *   3. Pose `data-theme` sur <html> et persiste chaque changement
 *   4. Utilise `document.startViewTransition` quand c'est possible pour un
 *      fondu racine fluide (sinon bascule immediate + transitions CSS sur body)
 *
 * L'anti-FOUC est gere par un script inline dans `app/layout.tsx` qui pose
 * `data-theme` AVANT l'hydratation React — voir `ThemePreloadScript`.
 */

export type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "tp:theme";
const DEFAULT_THEME: Theme = "dark";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialTheme(): Theme {
  if (typeof document === "undefined") return DEFAULT_THEME;
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  return DEFAULT_THEME;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function commitThemeChange(next: Theme, setThemeState: (t: Theme) => void) {
  applyTheme(next);
  setThemeState(next);
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* localStorage indisponible (mode prive, etc.) — ignore */
  }
}

/** Transition document (crossfade) quand le navigateur le permet — sinon bascule immédiate. */
function runWithThemeTransition(run: () => void) {
  if (
    typeof document === "undefined" ||
    prefersReducedMotion() ||
    typeof document.startViewTransition !== "function"
  ) {
    run();
    return;
  }
  document.startViewTransition(run);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readInitialTheme());
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-preload");
  }, []);

  const setTheme = useCallback((next: Theme) => {
    runWithThemeTransition(() => {
      commitThemeChange(next, setThemeState);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = themeRef.current === "dark" ? "light" : "dark";
    runWithThemeTransition(() => {
      commitThemeChange(next, setThemeState);
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme doit etre appele a l'interieur d'un <ThemeProvider>");
  }
  return ctx;
}

/**
 * Script inline a injecter dans <head> pour eviter le flash de theme (FOUC).
 * A executer AVANT le rendu React : il lit localStorage / prefers-color-scheme
 * et pose `data-theme` ainsi qu'une classe `theme-preload` qui desactive les
 * transitions pendant l'hydratation.
 */
export const THEME_PRELOAD_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem("${STORAGE_KEY}");
    var theme = (stored === "dark" || stored === "light") ? stored : "${DEFAULT_THEME}";
    var root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    root.classList.add("theme-preload");
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "${DEFAULT_THEME}");
  }
})();
`.trim();
