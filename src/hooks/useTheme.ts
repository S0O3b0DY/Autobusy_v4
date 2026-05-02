
import { useEffect, useState } from "react"

type Theme = "light" | "dark"

function getInitial(): Theme {
  const saved = localStorage.getItem("theme") as Theme | null
  if (saved) return saved
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitial)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    localStorage.setItem("theme", theme)
  }, [theme])

  return {
    theme,
    isDark: theme === "dark",
    toggle: (tu?: Theme) => tu ? setTheme(tu) : setTheme(t => t === "dark" ? "light" : "dark"),
  }
}
