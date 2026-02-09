import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeContextProvider({ children }) {
    const [theme, setTheme] = useState("system");

    useEffect(() => {
        const root = document.documentElement;

        if (theme === "dark") {
            root.classList.add("dark");
        } else if (theme === "light") {
            root.classList.remove("dark");
        } else {
            const media = window.matchMedia("(prefers-color-scheme: dark)");
            root.classList.toggle("dark", media.matches);
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