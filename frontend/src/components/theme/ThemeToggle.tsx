"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
        theme === "dark"
          ? "border-white/10 bg-obsidian-850 hover:bg-obsidian-800 text-slate-300 hover:text-white"
          : "border-slate-300 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 shadow-sm"
      } ${className}`}
      title={theme === "dark" ? "Alternar para Modo Claro" : "Alternar para Modo Escuro"}
      aria-label="Alternar tema de cor"
    >
      {theme === "dark" ? (
        <>
          <Sun className="h-3.5 w-3.5 text-amber-400 animate-spin-slow" />
          {showLabel && <span>Modo Claro</span>}
        </>
      ) : (
        <>
          <Moon className="h-3.5 w-3.5 text-indigo-600" />
          {showLabel && <span>Modo Escuro</span>}
        </>
      )}
    </button>
  );
}
