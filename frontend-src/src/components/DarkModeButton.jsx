import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import "./DarkMode.css";

export default function DarkModeButton() {
  const { theme, toggleTheme } = useTheme();
  const isDarkTheme = theme === "dark";
  // Os icones vetoriais mantem o contraste sem depender das imagens de public.
  const ThemeIcon = isDarkTheme ? Sun : Moon;

  return (
    <button
      type="button"
      className="dark-mode-button"
      onClick={toggleTheme}
      aria-label={isDarkTheme ? "Ativar modo claro" : "Ativar modo escuro"}
      aria-pressed={isDarkTheme}
      title={isDarkTheme ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      <ThemeIcon size={22} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}
