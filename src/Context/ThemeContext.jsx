import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeContextProvider({ children }) {
    const savedTheme = localStorage.getItem("theme") || "system";
    const [theme, setTheme] = useState(savedTheme);
    localStorage.setItem("theme", theme);

    useEffect(() => {
        const root = document.documentElement;
        const media = window.matchMedia("(prefers-color-scheme: dark)");

        const applyTheme = () => {
            if (theme === "dark") {
                root.classList.add("dark");
            } else if (theme === "light") {
                root.classList.remove("dark");
            } else {
                root.classList.toggle("dark", media.matches);
            }
        }

        applyTheme();

        // Change theme on the browser configuration
        media.addEventListener("change", applyTheme);

        return () => {
            media.removeEventListener("change", applyTheme);
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useThemeContext() {
    return useContext(ThemeContext);
}