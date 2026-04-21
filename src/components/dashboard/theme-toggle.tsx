import { useState } from "react";
import { MoonIcon, SunIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { THEME_STORAGE_KEY } from "@/lib/constants";
import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark";

function resolveInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "dark" || storedTheme === "light") {
      return storedTheme;
    }
  } catch {
    // Ignore localStorage access errors.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(nextTheme: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.toggle("dark", nextTheme === "dark");

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch {
    // Ignore localStorage access errors.
  }
}

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode>(() => resolveInitialTheme());

  const isDarkMode = theme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        const nextTheme: ThemeMode = isDarkMode ? "light" : "dark";
        setTheme(nextTheme);
        applyTheme(nextTheme);
      }}
      aria-label={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={cn("h-11 w-full sm:h-7 sm:w-[138px]", className)}
    >
      {isDarkMode ? <SunIcon /> : <MoonIcon />}
      {isDarkMode ? "Modo claro" : "Modo oscuro"}
    </Button>
  );
}
