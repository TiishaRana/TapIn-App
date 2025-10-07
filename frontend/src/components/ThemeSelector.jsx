import { SunIcon, MoonIcon } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";

const ThemeSelector = () => {
  const { theme, setTheme } = useThemeStore();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "night" : "light");
  };

  return (
    <button className="btn btn-ghost btn-circle" onClick={toggleTheme}>
      {theme === "light" ? (
        <SunIcon className="h-6 w-6 text-base-content opacity-70" />
      ) : (
        <MoonIcon className="h-6 w-6 text-base-content opacity-70" />
      )}
    </button>
  );
};
export default ThemeSelector;
